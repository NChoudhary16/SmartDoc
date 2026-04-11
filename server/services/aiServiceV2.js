const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

let GoogleGenerativeAI = null;
try {
  ({ GoogleGenerativeAI } = require('@google/generative-ai'));
} catch {
  GoogleGenerativeAI = null;
}

const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || '').trim();
const OPENAI_API_URL = (process.env.OPENAI_API_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const OPENAI_MODEL = process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini';
const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || '').trim();
const GEMINI_MODEL = process.env.GEMINI_LLM_MODEL || 'gemini-2.0-flash';
const REQUEST_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 25000);

class AIServiceV2 {
  constructor() {
    this._geminiModel = null;
    this._warnedOpenAI = false;
    this._warnedGemini = false;

    if (GEMINI_API_KEY && GoogleGenerativeAI) {
      this._geminiModel = new GoogleGenerativeAI(GEMINI_API_KEY).getGenerativeModel({
        model: GEMINI_MODEL
      });
    }

    const providers = [
      OPENAI_API_KEY ? `openai:${OPENAI_MODEL}` : null,
      this._geminiModel ? `gemini:${GEMINI_MODEL}` : null,
      'rule_fallback'
    ].filter(Boolean);

    console.log(`[AIService] provider chain: ${providers.join(' -> ')}`);
  }

  async _callOpenAI(prompt) {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0,
          messages: [
            { role: 'system', content: 'Return strict JSON only. Do not use markdown fences.' },
            { role: 'user', content: prompt }
          ]
        }),
        signal: controller.signal
      });

      const body = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(body);
      } catch {
        parsed = null;
      }

      if (!response.ok) {
        const message = parsed?.error?.message || body || `HTTP ${response.status}`;
        throw new Error(message);
      }

      const text = parsed?.choices?.[0]?.message?.content;
      if (!text) throw new Error('OpenAI returned empty content');
      return text;
    } finally {
      clearTimeout(timeout);
    }
  }

  async _callGemini(prompt) {
    if (!this._geminiModel) throw new Error('Gemini model not configured');
    const result = await this._geminiModel.generateContent(prompt);
    const text = result?.response?.text();
    if (!text) throw new Error('Gemini returned empty response');
    return text;
  }

  async _callLLM(prompt) {
    if (OPENAI_API_KEY) {
      try {
        return await this._callOpenAI(prompt);
      } catch (error) {
        if (!this._warnedOpenAI) {
          this._warnedOpenAI = true;
          console.warn('[AIService] OpenAI call failed, falling back:', error.message || error);
        }
      }
    }

    if (this._geminiModel) {
      try {
        return await this._callGemini(prompt);
      } catch (error) {
        if (!this._warnedGemini) {
          this._warnedGemini = true;
          console.warn('[AIService] Gemini call failed, falling back:', error.message || error);
        }
      }
    }

    throw new Error('No available LLM provider');
  }

  extractJsonFromText(raw) {
    const text = String(raw || '');
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const body = fenced ? fenced[1].trim() : text.trim();
    const jsonStart = body.indexOf('{');
    const jsonEnd = body.lastIndexOf('}') + 1;
    if (jsonStart < 0 || jsonEnd <= jsonStart) {
      throw new Error('No JSON object found in model response');
    }
    return JSON.parse(body.substring(jsonStart, jsonEnd));
  }

  _fallbackExtract(rawText) {
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
      summary: 'Fallback extraction because AI provider is unavailable.',
      template_match_prompt: `${detectedType} template with extracted key fields`
    };
  }

  async extractData(rawText) {
    const prompt = `
You are an expert document parser. Extract key data points from the OCR text below.
Determine the document type (Invoice, MOU, Purchase Order, Grant Application, Review Memo, Contract, etc.)
and extract all relevant fields into structured JSON.

If it's an Invoice, look for: invoice_number, date, vendor_name, total_amount, currency, line_items.
If it's an MOU or Contract, look for: parties involved, effective_date, purpose, key_clauses.
If it's a Purchase Order, look for: po_number, shipping_address, items, quantities, total_price.
If it's a Grant Application or Mentor Review: startup_name, founder_name, program_name, funding_request, recommendation, mentor_notes.

Raw OCR Text:
"""
${String(rawText || '').slice(0, 6000)}
"""

Return ONLY a valid JSON object (no markdown), with this exact shape:
{
  "document_type": "string",
  "confidence_score": number,
  "layout_hint": "string",
  "data": { ...extracted_fields },
  "summary": "Brief 1-sentence summary",
  "template_match_prompt": "A prompt to find the best template for this document"
}
`;

    try {
      const text = await this._callLLM(prompt);
      const parsed = this.extractJsonFromText(text);
      return {
        document_type: parsed.document_type || 'General Document',
        confidence_score: parsed.confidence_score || 0.5,
        layout_hint: parsed.layout_hint || 'sectioned',
        data: parsed.data || parsed,
        summary: parsed.summary || '',
        template_match_prompt: parsed.template_match_prompt || parsed.document_type || ''
      };
    } catch (error) {
      console.error('[AIService] extractData error:', error.message || error);
      return this._fallbackExtract(rawText);
    }
  }

  async verifyGeneratedData({ extractedData, generatedData, documentType }) {
    const prompt = `
You are a strict document QA auditor.
Compare the extracted source data with the generated payload for a "${documentType || 'document'}".

Extracted Source JSON:
${JSON.stringify(extractedData || {}, null, 2)}

Generated Payload JSON:
${JSON.stringify(generatedData || {}, null, 2)}

Rules:
- approved=true ONLY when generatedData is consistent with extractedData and no critical fields are missing.
- confidence is a number between 0 and 1.
- issues should list concrete mismatch reasons.
- missing_fields should list keys absent from generatedData.

Return ONLY valid JSON (no markdown) with exactly this shape:
{
  "approved": boolean,
  "confidence": number,
  "issues": ["string"],
  "missing_fields": ["string"]
}
`;

    try {
      const text = await this._callLLM(prompt);
      const parsed = this.extractJsonFromText(text);
      return {
        approved: Boolean(parsed.approved),
        confidence: Number.isFinite(parsed.confidence) ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        missing_fields: Array.isArray(parsed.missing_fields) ? parsed.missing_fields : []
      };
    } catch (error) {
      console.error('[AIService] verifyGeneratedData error:', error.message || error);
      return {
        approved: false,
        confidence: 0,
        issues: ['Verification failed - manual review required'],
        missing_fields: []
      };
    }
  }

  async refineData(originalData, edits) {
    return { ...originalData, ...edits };
  }
}

module.exports = new AIServiceV2();
