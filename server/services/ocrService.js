const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const PizZip = require('pizzip');

class OcrService {
  extractDocxText(filePath) {
    const buffer = fs.readFileSync(filePath);
    const zip = new PizZip(buffer);
    const documentXml = zip.file('word/document.xml')?.asText() || '';
    const normalized = documentXml
      .replace(/<w:p[^>]*>/g, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) {
      throw new Error('DOCX text extraction returned empty content');
    }

    return normalized;
  }

  /**
   * Extracts text from an uploaded image or scanned document using Tesseract OCR.
   * @param {string} filePath - Path to the file to scan
   * @returns {string} - Extracted text
   */
  async scanFile(filePath) {
    try {
      const extension = path.extname(filePath).toLowerCase();
      if (extension === '.pdf') {
        const buffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: buffer });
        try {
          const parsed = await parser.getText();
          const pdfText = String(parsed.text || '').trim();
          if (!pdfText) {
            throw new Error('PDF text extraction returned empty content');
          }
          return pdfText;
        } finally {
          await parser.destroy();
        }
      }
      if (extension === '.docx') {
        return this.extractDocxText(filePath);
      }
      console.log(`Starting Tesseract OCR for: ${filePath}`);
      const result = await Tesseract.recognize(filePath, 'eng');
      console.log('OCR scan complete.');
      return result.data.text;
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from document');
    }
  }
}

module.exports = new OcrService();
