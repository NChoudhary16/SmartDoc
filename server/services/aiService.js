const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Or gemini-2.0-flash if available
  }

  /**
   * Extracts JSON data from raw OCR text.
   * @param {string} rawText - Raw text from OCR scan
   * @returns {object} - Extracted data and document type
   */
  async extractData(rawText) {
    const prompt = `
      You are an expert document parser. Your goal is to extract key data points from the following OCR text.
      Determine the type of document (e.g., Invoice, MOU, Purchase Order, Contract) and extract all relevant fields into a structured JSON.
      
      If it's an Invoice, look for: invoice_number, date, vendor_name, total_amount, currency, line_items.
      If it's an MOU or Contract, look for: parties involved, effective_date, purpose, key_clauses.
      If it's a Purchase Order, look for: po_number, shipping_address, items, quantities, total_price.
      
      Raw OCR Text:
      """
      ${rawText}
      """
      
      Response Format (JSON ONLY):
      {
        "document_type": "string",
        "confidence_score": number,
        "data": { ...extracted_fields },
        "summary": "Brief 1-sentence summary of the document",
        "template_match_prompt": "A prompt to find the best template for this document (e.g. 'Standard B2B Purchase Order template with VAT')"
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from potential Markdown blocks
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonContent = text.substring(jsonStart, jsonEnd);
      
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Error in AI Service:', error);
      throw new Error('AI extraction failed');
    }
  }

  /**
   * Refines or edits JSON data if needed (optional)
   */
  async refineData(originalData, edits) {
     // Logic to merge edits or use LLM to validate updated JSON
     return { ...originalData, ...edits };
  }
}

module.exports = new AIService();
