const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

class DocGenService {
  /**
   * Generates a DOCX file from a template and data.
   * @param {object} data - JSON data for the template
   * @param {string} templateName - Name of the template file in /templates
   * @returns {string} - Path to generated file
   */
  async generateDocx(data, templateName) {
    try {
      const templatePath = path.resolve(__dirname, '../templates', templateName);
      const content = fs.readFileSync(templatePath, 'binary');
      
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Render the document (replace tags with data)
      doc.render(data);

      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      const outputName = `generated-${Date.now()}.docx`;
      const outputPath = path.resolve(__dirname, '../uploads', outputName);
      
      fs.writeFileSync(outputPath, buf);
      return outputName;
    } catch (error) {
      console.error('Error generating DOCX:', error);
      throw new Error('Document generation failed');
    }
  }

  /**
   * Mock PDF generation (could also convert DOCX to PDF using other libs)
   */
  async generatePdf(data) {
    // In a real scenario, we might use puppeteer or a library that converts docx to pdf
    // For now, let's just show we can create a simple PDF with pdf-lib if needed.
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText(`Document Summary: ${JSON.stringify(data.summary)}`);
    
    const pdfBytes = await pdfDoc.save();
    const outputName = `generated-${Date.now()}.pdf`;
    const outputPath = path.resolve(__dirname, '../uploads', outputName);
    
    fs.writeFileSync(outputPath, pdfBytes);
    return outputName;
  }
}

module.exports = new DocGenService();
