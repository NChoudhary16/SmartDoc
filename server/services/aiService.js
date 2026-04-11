const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_MODEL = process.env.GEMINI_LLM_MODEL || 'gemini-2.0-flash';

class AIService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this._genAI = new GoogleGenerativeAI(apiKey);
      this._model = this._genAI.getGenerativeModel({ model: GEMINI_MODEL });
      console.log(`[AIService] Gemini model: ${GEMINI_MODEL}`);
    } else {
      this._genAI = null;
      this._model = null;
      console.warn('[AIService] GEMINI_API_KEY not set - fallback mode active.');
    }
  }

  isQuotaError(error) {
    const message = String(error?.message || '').toLowerCase();
    return (
      message.includes('quota') ||
      message.includes('too many requests') ||
      message.includes('rate limit') ||
      message.includes('[429')
    );
  }

  isModelUnavailableError(error) {
    const message = String(error?.message || '').toLowerCase();
    return (
      message.includes('not found') ||
      message.includes('not supported') ||
      message.includes('unsupported')
    );
  }

  _toIsoDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const alreadyIso = raw.match(/\b(\d{4})[-/](\d{2})[-/](\d{2})\b/);
    if (alreadyIso) {
      return `${alreadyIso[1]}-${alreadyIso[2]}-${alreadyIso[3]}`;
    }

    const monthNameMatch = raw.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i
    );
    if (monthNameMatch) {
      const monthMap = {
        january: 1,
        february: 2,
        march: 3,
        april: 4,
        may: 5,
        june: 6,
        july: 7,
        august: 8,
        september: 9,
        october: 10,
        november: 11,
        december: 12
      };
      const month = monthMap[monthNameMatch[1].toLowerCase()];
      const day = Number(monthNameMatch[2]);
      const year = Number(monthNameMatch[3]);
      if (month && day >= 1 && day <= 31 && year >= 1900) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    const slashDate = raw.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
    if (slashDate) {
      const month = Number(slashDate[1]);
      const day = Number(slashDate[2]);
      const year = Number(slashDate[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    return '';
  }

  _extractInvoiceFields(rawText) {
    const text = String(rawText || '');
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const invoiceNumberMatch = text.match(
      /\bInvoice(?:\s*(?:Number|No\.?|#))?\s*[:#\t ]+([A-Z0-9][A-Z0-9-]{2,})\b/i
    );

    const totalAmountMatch =
      text.match(/\b(?:Total(?:\s+Due)?|Amount\s+Due)\s*[:\t ]+\$?\s*([0-9]+(?:[.,][0-9]{1,2})?)\b/i) ||
      text.match(/\$\s*([0-9]+(?:[.,][0-9]{1,2})?)\b/);

    const dateMatch =
      text.match(/\b(?:Invoice\s+Date|Date)\b(?:\s*[:\t]\s*|\s{2,})([^\n]+)/i) ||
      text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i) ||
      text.match(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/) ||
      text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/);

    const fromIndex = lines.findIndex((line) => /^from\s*[:]?$/i.test(line));
    const toIndex = lines.findIndex((line) => /^(to|bill\s*to)\s*[:]?$/i.test(line));
    const vendorName =
      fromIndex >= 0 && lines[fromIndex + 1]
        ? lines[fromIndex + 1].replace(/^[\W_]+/, '').trim()
        : (text.match(/\bVendor\s*[:\t ]+([^\n]+)/i)?.[1] || '').trim();
    const startupName =
      toIndex >= 0 && lines[toIndex + 1]
        ? lines[toIndex + 1].replace(/^[\W_]+/, '').trim()
        : (text.match(/\b(?:Startup|Bill\s*To|Customer)\s*[:\t ]+([^\n]+)/i)?.[1] || '').trim();

    const currencyCode =
      text.match(/\b(USD|EUR|INR|GBP|AUD|CAD|SGD)\b/i)?.[1]?.toUpperCase() ||
      (text.includes('$') ? 'USD' : '');

    const normalizedDate = this._toIsoDate(dateMatch?.[1] || dateMatch?.[0] || '');
    const numericAmount = totalAmountMatch?.[1]
      ? Number(String(totalAmountMatch[1]).replace(/,/g, ''))
      : null;

    return {
      invoice_number: invoiceNumberMatch?.[1] || '',
      total_amount: Number.isFinite(numericAmount) ? numericAmount : '',
      currency: currencyCode || '',
      date: normalizedDate || '',
      vendor_name: vendorName || '',
      startup_name: startupName || ''
    };
  }

  _sanitizeValue(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.map((item) => this._sanitizeValue(item));
    if (typeof value === 'object') {
      const out = {};
      Object.entries(value).forEach(([key, inner]) => {
        out[key] = this._sanitizeValue(inner);
      });
      return out;
    }
    return value;
  }

  _isBlank(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  _deterministicVerify(extractedData, generatedData) {
    const source = extractedData && typeof extractedData === 'object' ? extractedData : {};
    const output = generatedData && typeof generatedData === 'object' ? generatedData : {};
    const sourceKeys = Object.keys(source).filter((key) => !this._isBlank(source[key]));
    const missing_fields = sourceKeys.filter((key) => this._isBlank(output[key]));
    const issues = missing_fields.map((field) => `Missing field in generated payload: ${field}`);
    const approved = missing_fields.length === 0;
    const confidence = sourceKeys.length
      ? Number(((sourceKeys.length - missing_fields.length) / sourceKeys.length).toFixed(2))
      : approved
        ? 0.8
        : 0.3;

    return {
      approved,
      confidence: Math.max(0, Math.min(1, confidence)),
      issues,
      missing_fields
    };
  }

  // ---------------------------------------------------------------------------
  // Core Gemini call - returns raw text
  // ---------------------------------------------------------------------------
  async _callGemini(prompt) {
    if (!this._model) throw new Error('GEMINI_API_KEY is not configured');

    const result = await this._model.generateContent(prompt);
    const text = result?.response?.text();
    if (!text) throw new Error('Gemini returned empty response');
    return text;
  }

  // ---------------------------------------------------------------------------
  // Extract JSON from a Gemini response that may include markdown fences
  // ---------------------------------------------------------------------------
  extractJsonFromText(raw) {
    const text = String(raw || '');

    // Strip ```json ... ``` or ``` ... ``` fences
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const body = fenced ? fenced[1].trim() : text.trim();

    const jsonStart = body.indexOf('{');
    const jsonEnd = body.lastIndexOf('}') + 1;
    if (jsonStart < 0 || jsonEnd <= jsonStart) {
      throw new Error('No JSON object found in Gemini response');
    }
    return JSON.parse(body.substring(jsonStart, jsonEnd));
  }

  // ---------------------------------------------------------------------------
  // Fallback regex extractor (used when Gemini is unavailable)
  // ---------------------------------------------------------------------------
  _fallbackExtract(rawText) {
    const text = String(rawText || '');
    const invoiceFields = this._extractInvoiceFields(text);

    const isPurchaseOrder = /\bpurchase\s*order\b|\bpo\s*number\b/i.test(text);
    const isInvoice = /\binvoice\b/i.test(text);
    const isMou = /\bmou\b|memorandum of understanding/i.test(text);
    const isGrant = /\bgrant\b|\bfunding request\b|\bapplication\b/i.test(text);
    const isReviewMemo = /\breview\b|\bmentor notes?\b|\bmemo\b/i.test(text);

    const resolvedType = isPurchaseOrder
      ? 'Purchase Order'
      : isInvoice
        ? 'Invoice'
        : isMou
          ? 'MOU'
          : isGrant
            ? 'Grant Application'
            : isReviewMemo
              ? 'Review Memo'
              : 'General Document';

    const poNumber = text.match(/\b(?:PO|Purchase\s*Order)\s*(?:Number|No\.?|#)?\s*[:#\t ]+([A-Z0-9-]{2,})\b/i)?.[1] || '';
    const fundingRequestRaw = text.match(/\b(?:Funding\s*Request|Requested\s*Funding)\s*[:\t ]+\$?\s*([0-9]+(?:[.,][0-9]{1,2})?)\b/i)?.[1] || '';
    const fundingRequest = fundingRequestRaw ? Number(String(fundingRequestRaw).replace(/,/g, '')) : '';

    const baseData = {
      ...invoiceFields,
      po_number: poNumber,
      funding_request: Number.isFinite(fundingRequest) ? fundingRequest : '',
      raw_excerpt: text.slice(0, 800)
    };

    return {
      document_type: resolvedType,
      confidence_score: 0.35,
      layout_hint: /review|memo/i.test(text) ? 'memo' : /invoice|purchase order/i.test(text) ? 'tabular' : 'sectioned',
      data: this._sanitizeValue(baseData),
      summary: 'Fallback extraction - Gemini unavailable or rate-limited.',
      template_match_prompt: `${resolvedType} template with extracted key fields`
    };
  }

  // ---------------------------------------------------------------------------
  // PUBLIC: Extract structured data from OCR text
  // ---------------------------------------------------------------------------
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
      const text = await this._callGemini(prompt);
      const parsed = this.extractJsonFromText(text);
      const normalizedData = this._sanitizeValue(parsed.data || parsed || {});

      return {
        document_type: parsed.document_type || 'General Document',
        confidence_score: parsed.confidence_score || 0.5,
        layout_hint: parsed.layout_hint || 'sectioned',
        data: normalizedData,
        summary: parsed.summary || '',
        template_match_prompt: parsed.template_match_prompt || parsed.document_type || ''
      };
    } catch (error) {
      if (this.isQuotaError(error)) {
        console.error('[AIService] extractData quota-limited, using deterministic fallback');
      } else if (this.isModelUnavailableError(error)) {
        console.error('[AIService] extractData model unavailable, using deterministic fallback');
      } else {
        console.error('[AIService] extractData error:', error.message || error);
      }
      return this._fallbackExtract(rawText);
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC: Verify generated payload matches extracted source
  // ---------------------------------------------------------------------------
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
      const text = await this._callGemini(prompt);
      const parsed = this.extractJsonFromText(text);
      return {
        approved: Boolean(parsed.approved),
        confidence: Number.isFinite(parsed.confidence)
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0,
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        missing_fields: Array.isArray(parsed.missing_fields) ? parsed.missing_fields : []
      };
    } catch (error) {
      if (this.isQuotaError(error)) {
        console.error('[AIService] verifyGeneratedData quota-limited, using deterministic fallback');
      } else if (this.isModelUnavailableError(error)) {
        console.error('[AIService] verifyGeneratedData model unavailable, using deterministic fallback');
      } else {
        console.error('[AIService] verifyGeneratedData error:', error.message || error);
      }
      return this._deterministicVerify(extractedData, generatedData);
    }
  }

  // ---------------------------------------------------------------------------
  // Public: optional refine pass (merges edits, light normalization)
  // ---------------------------------------------------------------------------
  async refineData(originalData, edits) {
    return this._sanitizeValue({ ...originalData, ...edits });
  }
}

module.exports = new AIService();
