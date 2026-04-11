const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiServiceV2');
const mockExtractionService = require('../services/mockExtractionService');
const ragService = require('../services/ragService');
const lifecycleService = require('../services/documentLifecycleServiceV2');
const dispatchService = require('../services/dispatchService');
const validationService = require('../services/documentValidationService');
const departmentRoutingService = require('../services/departmentRoutingService');
const templateCatalogService = require('../services/templateCatalogService');

const { requireAuth, requireRole } = require('../middleware/auth');

const docGenService = require('../services/docGenService');

/**
 * Route: POST /api/documents/process
 * Logic: Upload -> OCR -> AI (Source of Truth JSON) -> Template Suggestion
 */
router.post('/process', requireAuth, requireRole('startup', 'mentor', 'employee', 'admin'), upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const useMockExtraction = String(process.env.USE_MOCK_EXTRACTION || 'false').toLowerCase() === 'true';

    const filePath = req.file.path;
    const originalFile = req.file.filename;
    let documentRecord = await lifecycleService.createDocument({
      created_by: req.user.id,
      created_by_name: req.user.name,
      creator_role: req.user.role,
      original_file: originalFile,
      status: 'uploaded'
    });

    // 1. OCR Step + store document content vector in DB (same space as template embeddings)
    const rawText = await ocrService.scanFile(filePath);
    const contentEmbedding = await ragService.generateEmbedding(
      String(rawText || '')
        .trim()
        .slice(0, 8000)
    );
    documentRecord = await lifecycleService.updateDocument(documentRecord.id, {
      status: 'extracted',
      ...(contentEmbedding ? { content_embedding: contentEmbedding } : {})
    });

    // 2. AI Extraction Step (JSON Source of Truth)
    const extractionResult = useMockExtraction ? mockExtractionService.extractData(rawText) : await aiService.extractData(rawText);
    const extractedData = extractionResult.data || {};

    // 3. RAG: vector similarity + optional category (document type) filter → DOCX template from DB
    const suggestedTemplate = await ragService.matchTemplate(
      extractionResult,
      extractionResult.template_match_prompt,
      { ocrText: rawText }
    );
    const validationReport = validationService.validate({
      data: extractedData,
      template: suggestedTemplate,
      documentType: extractionResult.document_type
    });
    const routedDepartment = departmentRoutingService.resolveDepartment({
      documentType: extractionResult.document_type,
      template: suggestedTemplate,
      extractedData
    });
    documentRecord = await lifecycleService.updateDocument(documentRecord.id, {
      status: 'matched',
      extracted_json: extractedData,
      document_type: extractionResult.document_type || null,
      template_name: suggestedTemplate?.file_path || 'default_template.docx',
      template_id: suggestedTemplate?.id || null,
      summary: extractionResult.summary || null,
      validation_report: validationReport,
      department: routedDepartment
    });

    // 4. Generate preview PDF
    const previewPdf = await docGenService.generatePdf({
      summary: extractionResult.summary,
      data: extractedData
    });
    documentRecord = await lifecycleService.updateDocument(documentRecord.id, {
      status: 'generated_pdf',
      artifacts: {
        ...(documentRecord.artifacts || {}),
        preview_pdf: previewPdf
      }
    });

    // 5. Verification gate (skip LLM call when mock extraction is enabled)
    const verification = useMockExtraction
      ? {
          approved: true,
          confidence: 1,
          issues: [],
          missing_fields: []
        }
      : await aiService.verifyGeneratedData({
          extractedData,
          generatedData: extractedData,
          documentType: extractionResult.document_type
        });
    documentRecord = await lifecycleService.updateDocument(documentRecord.id, {
      status: 'llm_verified',
      verification_report: verification
    });

    const draftNote = !validationReport.passed
      ? 'Initial validation issues — correct fields below, then submit for admin.'
      : !verification.approved
        ? 'Automated audit suggests review — you may still submit; admin will decide.'
        : 'Review and edit the extracted data, then use Submit for admin approval. Your draft is reverified on submit before it joins the queue.';
    const finalStatus = 'awaiting_submitter';
    documentRecord = await lifecycleService.updateDocument(documentRecord.id, {
      status: finalStatus,
      review_comments: draftNote,
      history_note: undefined,
      artifacts: {
        ...(documentRecord.artifacts || {}),
        pipeline: {
          source_file: originalFile,
          matched_template_file: suggestedTemplate?.file_path || null,
          matched_template_name: suggestedTemplate?.name || null,
          category: extractionResult.document_type || suggestedTemplate?.type || null,
          extraction_mode: useMockExtraction ? 'mock' : 'llm'
        }
      }
    });
    res.json({
      success: true,
      document_id: documentRecord.id,
      original_file: req.file.filename,
      extracted_data: extractedData,
      suggested_template: suggestedTemplate,
      summary: extractionResult.summary,
      verification,
      validation: validationReport,
      status: finalStatus,
      department: routedDepartment,
      review_hint: draftNote,
      preview_url: `/uploads/${previewPdf}`,
      editable_output_formats: validationReport.editable_output_formats,
      extraction_mode: useMockExtraction ? 'mock' : 'llm',
      auto_submitted_to_admin: false
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Route: GET /api/documents/pending
 * Logic: List docs pending admin approval
 */
router.get('/pending/list', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const rows = await lifecycleService.listPending();
    res.json({ success: true, documents: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/pending', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const rows = await lifecycleService.listPending();
    res.json({ success: true, documents: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await lifecycleService.listDocuments({
      role: req.user.role,
      userId: req.user.id,
      search: req.query.search || '',
      status: req.query.status || ''
    });
    res.json({ success: true, documents: rows });
  } catch (error) {
    next(error);
  }
});

/**
 * Route: GET /api/documents/:id
 * Logic: Get one document lifecycle record
 */
router.get('/track/search', requireAuth, async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ success: false, message: 'q is required' });
    }

    const rows = await lifecycleService.listDocuments({
      role: req.user.role,
      userId: req.user.id,
      search: query
    });

    res.json({
      success: true,
      result: rows[0] || null,
      recent: rows.slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/documents/:id/submit-for-review
 * Submitter saves edited draft and moves document into the admin queue (pending_admin).
 */
router.post(
  '/:id/submit-for-review',
  requireAuth,
  requireRole('startup', 'mentor', 'employee'),
  async (req, res, next) => {
    try {
      const doc = await lifecycleService.getDocument(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
      if (String(doc.created_by) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'You can only submit your own documents' });
      }
      if (doc.status === 'approved' || doc.status === 'dispatched') {
        return res.status(409).json({
          success: false,
          message: 'This document is already approved or dispatched'
        });
      }

      const { data, template_name, template_id } = req.body || {};
      const mergedData = data != null ? data : doc.extracted_json || {};

      const templateForVal = templateCatalogService.normalizeTemplate({
        id: template_id != null ? template_id : doc.template_id,
        file_path: template_name != null ? template_name : doc.template_name,
        type: doc.document_type
      });

      const validationReport = validationService.validate({
        data: mergedData,
        template: templateForVal,
        documentType: doc.document_type
      });

      if (!validationReport.passed) {
        return res.status(422).json({
          success: false,
          message: 'Reverification failed: required fields or format checks did not pass. Fix the highlighted issues and try again.',
          validation: validationReport
        });
      }

      const verification = await aiService.verifyGeneratedData({
        extractedData: doc.extracted_json || {},
        generatedData: mergedData,
        documentType: doc.document_type
      });

      const routedDepartment = departmentRoutingService.resolveDepartment({
        documentType: doc.document_type,
        template: templateForVal,
        extractedData: mergedData
      });

      const reviewComments = !verification.approved
        ? (verification.issues && verification.issues.length
            ? verification.issues.slice(0, 4).join(' · ')
            : 'AI audit did not fully approve — admin will review.')
        : null;

      const payload = {
        status: 'pending_admin',
        extracted_json: mergedData,
        validation_report: validationReport,
        verification_report: verification,
        department: routedDepartment,
        review_comments: reviewComments,
        history_note: 'Submitted for admin review (reverified)'
      };
      if (template_name != null) payload.template_name = template_name;
      if (template_id != null) payload.template_id = template_id;

      const updated = await lifecycleService.updateDocument(doc.id, payload);
      res.json({
        success: true,
        message: 'Document submitted to the admin review queue',
        document: updated,
        validation: validationReport,
        verification
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const doc = await lifecycleService.getDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    const canView = req.user.role === 'admin' || req.user.id === doc.created_by;
    if (!canView) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
});

/**
 * Route: POST /api/documents/:id/approve
 * Logic: Admin approves, generate final DOCX, bump version, dispatch
 */
router.post('/:id/approve', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { data, templateName, department } = req.body;
    const doc = await lifecycleService.getDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
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

    const approvalWarnings = [];
    if (!validationReport.passed) {
      approvalWarnings.push(
        `Validation issues at approval: ${validationReport.issues.slice(0, 5).join(' | ')}`
      );
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
    const resolvedDepartment =
      (department && String(department).trim()) || doc.department || routedDepartment;

    const templateInfo = {
      id: doc.template_id,
      file_path: templateToUse,
      type: doc.document_type
    };
    const outputFileName = await docGenService.generateDocx(payload, templateToUse, templateInfo, {
      approvedByName: req.user.name || req.user.username || 'Administrator',
      approvedByRole: req.user.role || 'admin',
      approvedAt: new Date().toISOString(),
      documentId: doc.id,
      department: resolvedDepartment,
      sourceFileName: doc.original_file || ''
    });

    const nextVersion = Number(doc.version || 1) + 1;
    const updated = await lifecycleService.updateDocument(doc.id, {
      status: 'approved',
      approved_by: req.user.id,
      version: nextVersion,
      department: resolvedDepartment,
      extracted_json: payload,
      validation_report: validationReport,
      review_comments: approvalWarnings.length ? approvalWarnings.join(' ') : (doc.review_comments || null),
      artifacts: {
        ...(doc.artifacts || {}),
        final_docx: outputFileName,
        approval_warnings: approvalWarnings
      }
    });

    const dispatch = await dispatchService.dispatchDocument({
      department: resolvedDepartment,
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

    res.json({
      success: true,
      message: 'Document approved — final DOCX generated and routed to the responsible department',
      document: dispatchedDoc,
      downloadUrl: `/uploads/${outputFileName}`,
      primary_output: 'docx',
      department: resolvedDepartment,
      approval_warnings: approvalWarnings,
      editable_output_formats: ['docx', 'pdf']
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Route: POST /api/documents/:id/reject
 * Logic: Admin rejects and keeps as draft
 */
router.post('/:id/reject', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { comment } = req.body;
    const doc = await lifecycleService.getDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    const updated = await lifecycleService.updateDocument(doc.id, {
      status: 'rejected',
      review_comments: comment || 'Rejected by admin'
    });
    res.json({ success: true, document: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * Route: POST /api/documents/:id/flag
 * Logic: Admin flags document for further review
 */
router.post('/:id/flag', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { comment } = req.body;
    const doc = await lifecycleService.getDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    const updated = await lifecycleService.updateDocument(doc.id, {
      status: 'flagged',
      review_comments: comment || 'Flagged by admin for follow-up'
    });
    res.json({ success: true, document: updated });
  } catch (error) {
    next(error);
  }
});


module.exports = router;

