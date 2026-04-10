const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const ragService = require('../services/ragService');

const docGenService = require('../services/docGenService');

/**
 * Route: POST /api/documents/process
 * Logic: Upload -> OCR -> AI (Source of Truth JSON) -> Template Suggestion
 */
router.post('/process', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;

    // 1. OCR Step
    const rawText = await ocrService.scanFile(filePath);

    // 2. AI Extraction Step (JSON Source of Truth)
    const extractionResult = await aiService.extractData(rawText);

    // 3. RAG Step (Find Matching Template)
    const suggestedTemplate = await ragService.matchTemplate(extractionResult.data, extractionResult.template_match_prompt);

    res.json({
      success: true,
      original_file: req.file.filename,
      extracted_data: extractionResult.data,
      suggested_template: suggestedTemplate,
      summary: extractionResult.summary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Route: POST /api/documents/approve
 * Logic: Receive JSON (edited or not) -> Generate Final DOC/PDF
 */
router.post('/approve', async (req, res, next) => {
  try {
    const { data, templateName, format = 'docx' } = req.body;

    let outputFileName;
    if (format === 'pdf') {
      outputFileName = await docGenService.generatePdf(data);
    } else {
      // Default to DOCX
      outputFileName = await docGenService.generateDocx(data, templateName || 'default_template.docx');
    }

    res.json({
      success: true,
      message: 'Document generated successfully',
      fileName: outputFileName,
      downloadUrl: `/uploads/${outputFileName}`
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
