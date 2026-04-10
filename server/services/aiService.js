const dotenv = require('dotenv');
dotenv.config();

const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
const OPENAI_LLM_MODEL = process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini';

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || null;
  }

  extractJsonFromText(text) {
    const body = String(text || '');
    const jsonStart = body.indexOf('{');
    const jsonEnd = body.lastIndexOf('}') + 1;
    if (jsonStart < 0 || jsonEnd <= jsonStart) {
      throw new Error('No JSON object found in LLM response');
    }
    return JSON.parse(body.substring(jsonStart, jsonEnd));
  }

  async callOpenAIChat(prompt) {
    if (!this.apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_LLM_MODEL,
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You extract structured data from documents. Always return valid JSON and no markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || `OpenAI chat failed (${response.status})`;
      throw new Error(message);
    }

    const text = payload?.choices?.[0]?.message?.content || '';
    if (!text) {
      throw new Error('OpenAI chat returned empty text');
    }
    return String(text);
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
      Also infer rough layout intent so the generation system can choose the right institutional DOCX arrangement.
      
      If it's an Invoice, look for: invoice_number, date, vendor_name, total_amount, currency, line_items.
      If it's an MOU or Contract, look for: parties involved, effective_date, purpose, key_clauses.
      If it's a Purchase Order, look for: po_number, shipping_address, items, quantities, total_price.
      If it's a grant, application, startup memo, or mentor review, look for: startup_name, founder_name, program_name, funding_request, recommendation, mentor_notes.
      
      Raw OCR Text:
      """
      ${rawText}
      """
      
      Response Format (JSON ONLY):
      {
        "document_type": "string",
        "confidence_score": number,
        "layout_hint": "string",
        "data": { ...extracted_fields },
        "summary": "Brief 1-sentence summary of the document",
        "template_match_prompt": "A prompt to find the best template for this document (e.g. 'Standard B2B Purchase Order template with VAT')"
      }
    `;

    try {
      const text = await this.callOpenAIChat(prompt);
      return this.extractJsonFromText(text);
    } catch (error) {
      console.error('Error in AI Service:', error);
      // Fallback extractor keeps pipeline functional when LLM is unavailable.
      const text = String(rawText || '');
      const invoiceMatch = text.match(/inv(?:oice)?[-_ ]?(?:number)?[:# ]*([a-z0-9-]+)/i);
      const amountMatch = text.match(/(?:total|amount)[: ]*([0-9]+(?:\.[0-9]{1,2})?)/i);
      const currencyMatch = text.match(/\b(USD|EUR|INR|GBP)\b/i);
      const dateMatch = text.match(/\b(20[0-9]{2}[-/][0-9]{2}[-/][0-9]{2})\b/);
      const vendorMatch = text.match(/vendor[: ]*([a-z0-9 .,&-]+)/i);
      const startupMatch = text.match(/startup[: ]*([a-z0-9 .,&-]+)/i);
      const detectedType = /invoice/i.test(text) ? 'Invoice' : 'General Document';
      return {
        document_type: detectedType,
        confidence_score: 0.35,
        layout_hint: /review|memo/i.test(text) ? 'memo' : /invoice|purchase order/i.test(text) ? 'tabular' : 'sectioned',
        data: {
          invoice_number: invoiceMatch?.[1] || null,
          total_amount: amountMatch?.[1] ? Number(amountMatch[1]) : null,
          currency: currencyMatch?.[1]?.toUpperCase() || null,
          date: dateMatch?.[1] || null,
          vendor_name: vendorMatch?.[1]?.trim() || null,
          startup_name: startupMatch?.[1]?.trim() || null,
          raw_excerpt: text.slice(0, 500)
        },
        summary: 'Fallback extraction used because LLM was unavailable.',
        template_match_prompt: `${detectedType} template with extracted key fields`
      };
    }
  }

  /**
   * Refines or edits JSON data if needed (optional)
   */
  async refineData(originalData, edits) {
     // Logic to merge edits or use LLM to validate updated JSON
     return { ...originalData, ...edits };
  }

  /**
   * Verifies generated payload against extracted source.
   * Returns deterministic JSON so workflow can gate approval.
   */
  async verifyGeneratedData({ extractedData, generatedData, documentType }) {
    const prompt = `
      You are a strict document QA auditor.
      Compare extracted source data with generated payload for a ${documentType || 'document'}.
      Return only valid JSON with this exact shape:
      {
        "approved": boolean,
        "confidence": number,
        "issues": ["string"],
        "missing_fields": ["string"]
      }

      Rules:
      - approved=true only when generatedData is consistent with extractedData and no critical fields are missing.
      - confidence is between 0 and 1.
      - issues should include concrete mismatch reasons.
      - missing_fields should include required keys missing from generatedData.

      Extracted Source JSON:
      ${JSON.stringify(extractedData || {}, null, 2)}

      Generated Payload JSON:
      ${JSON.stringify(generatedData || {}, null, 2)}
    `;

    try {
      const text = await this.callOpenAIChat(prompt);
      const parsed = this.extractJsonFromText(text);

      return {
        approved: Boolean(parsed.approved),
        confidence: Number.isFinite(parsed.confidence) ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        missing_fields: Array.isArray(parsed.missing_fields) ? parsed.missing_fields : []
      };
    } catch (error) {
      console.error('Error in AI verification:', error);
      return {
        approved: false,
        confidence: 0,
        issues: ['Verification failed, manual review required'],
        missing_fields: []
      };
    }
  }
}

module.exports = new AIService();
