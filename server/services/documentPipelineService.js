const ocrService = require('./ocrService');
const aiService = require('./aiService');
const ragService = require('./ragServiceV2');
const lifecycleService = require('./documentLifecycleServiceV2');
const dispatchService = require('./dispatchService');
const validationService = require('./documentValidationService');
const departmentRoutingService = require('./departmentRoutingService');
const docGenService = require('./docGenService');

class DocumentPipelineService {
  async processUpload({ file, user }) {
    const filePath = file.path;
    const originalFile = file.filename;

    let documentRecord = await lifecycleService.createDocument({
      created_by: user.id,
      created_by_name: user.name,
      creator_role: user.role,
      original_file: originalFile,
      status: 'uploaded'
    });

    const rawText = await ocrService.scanFile(filePath);
    documentRecord = await lifecycleService.updateDocument(documentRecord.id, {
      status: 'extracted'
    });

    const extractionResult = await aiService.extractData(rawText);
    const extractedData = extractionResult.data || {};
    const suggestedTemplate = await ragService.matchTemplate(extractionResult, extractionResult.template_match_prompt);
    const validationReport = validationService.validate({
      data: extractedData,
      template: suggestedTemplate,
      documentType: extractionResult.document_type
    });

    documentRecord = await lifecycleService.updateDocument(documentRecord.id, {
      status: 'matched',
      extracted_json: extractedData,
      document_type: extractionResult.document_type || null,
      template_name: suggestedTemplate?.file_path || 'default_template.docx',
      template_id: suggestedTemplate?.id || null,
      summary: extractionResult.summary || null,
      validation_report: validationReport,
      department: extractedData.department || extractedData.target_department || null
    });

    const draftDocx = await docGenService.generateDocx(
      extractedData,
      suggestedTemplate?.file_path || 'default_template.docx',
      suggestedTemplate
    );

    documentRecord = await lifecycleService.updateDocument(documentRecord.id, {
      status: 'draft_generated',
      artifacts: {
        ...(documentRecord.artifacts || {}),
        draft_docx: draftDocx
      }
    });

    const previewPdf = await docGenService.generatePdf({
      summary: extractionResult.summary,
      data: extractedData,
      template: suggestedTemplate?.name
    });

    documentRecord = await lifecycleService.updateDocument(documentRecord.id, {
      status: 'generated_pdf',
      artifacts: {
        ...(documentRecord.artifacts || {}),
        draft_docx: draftDocx,
        preview_pdf: previewPdf
      }
    });

    const verification = await aiService.verifyGeneratedData({
      extractedData,
      generatedData: extractedData,
      documentType: extractionResult.document_type
    });

    documentRecord = await lifecycleService.updateDocument(documentRecord.id, {
      status: 'llm_verified',
      verification_report: verification
    });

    const reviewStatus = verification.approved ? 'pending_admin' : 'rejected';
    documentRecord = await lifecycleService.updateDocument(documentRecord.id, {
      status: validationReport.passed ? reviewStatus : 'flagged',
      review_comments: validationReport.passed ? null : 'Institutional validation failed'
    });

    return {
      documentRecord,
      extractionResult,
      extractedData,
      suggestedTemplate,
      validationReport,
      verification,
      previewPdf,
      draftDocx,
      reviewStatus: validationReport.passed ? reviewStatus : 'flagged'
    };
  }

  async approveDocument({ documentId, data, templateName, department, approver }) {
    const doc = await lifecycleService.getDocument(documentId);
    if (!doc) {
      return null;
    }

    const payload = data || doc.extracted_json || {};
    const templateToUse = templateName || doc.template_name || 'default_template.docx';
    const validationReport = validationService.validate({
      data: payload,
      template: {
        id: doc.template_id,
        file_path: templateToUse
      },
      documentType: doc.document_type
    });

    if (!validationReport.passed) {
      const flagged = await lifecycleService.updateDocument(doc.id, {
        status: 'flagged',
        extracted_json: payload,
        validation_report: validationReport,
        review_comments: 'Approval blocked until institutional validation issues are resolved'
      });

      return {
        blocked: true,
        document: flagged,
        validation: validationReport
      };
    }

    const routedDepartment = departmentRoutingService.resolveDepartment({
      documentType: doc.document_type,
      template: {
        id: doc.template_id,
        file_path: templateToUse,
        type: doc.document_type
      },
      extractedData: payload
    });
    const resolvedDepartment = department || doc.department || routedDepartment;

    const outputFileName = await docGenService.generateDocx(
      payload,
      templateToUse,
      {
        id: doc.template_id,
        file_path: templateToUse,
        type: doc.document_type
      },
      {
        approvedByName: approver.name || approver.username || 'Administrator',
        approvedByRole: approver.role || 'admin',
        approvedAt: new Date().toISOString(),
        documentId: doc.id,
        department: resolvedDepartment,
        sourceFileName: doc.original_file || ''
      }
    );

    const nextVersion = Number(doc.version || 1) + 1;
    const updated = await lifecycleService.updateDocument(doc.id, {
      status: 'approved',
      approved_by: approver.id,
      version: nextVersion,
      department: resolvedDepartment,
      extracted_json: payload,
      validation_report: validationReport,
      artifacts: {
        ...(doc.artifacts || {}),
        final_docx: outputFileName
      }
    });

    const dispatch = await dispatchService.dispatchDocument({
      department: updated.department,
      documentId: doc.id,
      artifactUrl: `/uploads/${outputFileName}`
    });

    const dispatchedDoc = await lifecycleService.updateDocument(doc.id, {
      status: 'dispatched',
      artifacts: {
        ...(updated.artifacts || {}),
        dispatch: {
          ...dispatch,
          dispatched_at: new Date().toISOString()
        }
      }
    });

    return {
      blocked: false,
      document: dispatchedDoc,
      downloadUrl: `/uploads/${outputFileName}`,
      validation: validationReport
    };
  }
}

module.exports = new DocumentPipelineService();
