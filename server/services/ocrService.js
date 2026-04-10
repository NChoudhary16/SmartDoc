const Tesseract = require('tesseract.js');

class OcrService {
  /**
   * Extracts text from an uploaded image or scanned document using Tesseract OCR.
   * @param {string} filePath - Path to the file to scan
   * @returns {string} - Extracted text
   */
  async scanFile(filePath) {
    try {
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
