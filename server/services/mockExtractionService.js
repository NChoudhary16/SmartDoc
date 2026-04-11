const fs = require('fs');
const path = require('path');
const templateCatalogService = require('./templateCatalogService');

const mappingPath = path.join(__dirname, '..', 'config', 'mockExtractionMappings.json');
const categoryMappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

class MockExtractionService {
  sanitizeValue(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.map((item) => this.sanitizeValue(item));
    if (typeof value === 'object') {
      const out = {};
      Object.entries(value).forEach(([key, inner]) => {
        out[key] = this.sanitizeValue(inner);
      });
      return out;
    }
    return value;
  }

  pickFirstMatch(text, regexes = []) {
    for (const regex of regexes) {
      const match = text.match(regex);
      if (match?.[1]) return String(match[1]).trim();
      if (match?.[0]) return String(match[0]).trim();
    }
    return '';
  }

  normalizeDate(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';

    const iso = value.match(/\b(\d{4})[-/](\d{2})[-/](\d{2})\b/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

    const monthForm = value.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i
    );
    if (monthForm) {
      const months = {
        january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
        july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
      };
      const month = months[monthForm[1].toLowerCase()];
      const day = Number(monthForm[2]);
      const year = Number(monthForm[3]);
      if (month && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    const slash = value.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
    if (slash) {
      const month = Number(slash[1]);
      const day = Number(slash[2]);
      const year = Number(slash[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return '';
  }

  parseAmount(raw) {
    const number = Number(String(raw || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(number) ? number : '';
  }

  detectCategory(rawText) {
    const text = String(rawText || '').toLowerCase();
    const categories = Object.entries(categoryMappings)
      .filter(([name]) => name !== 'General Document');

    for (const [category, config] of categories) {
      const keywords = Array.isArray(config.keywords) ? config.keywords : [];
      if (keywords.some((keyword) => text.includes(String(keyword).toLowerCase()))) {
        return category;
      }
    }
    return 'General Document';
  }

  extractKnownFields(rawText, category) {
    const text = String(rawText || '');
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const fromIndex = lines.findIndex((line) => /^from\s*[:]?$/i.test(line));
    const toIndex = lines.findIndex((line) => /^(to|bill\s*to)\s*[:]?$/i.test(line));

    const invoiceNumber = this.pickFirstMatch(text, [
      /\bInvoice(?:\s*(?:Number|No\.?|#))?\s*[:#\t ]+([A-Z0-9-]{3,})\b/i
    ]);
    const poNumber = this.pickFirstMatch(text, [
      /\b(?:PO|Purchase\s*Order)\s*(?:Number|No\.?|#)?\s*[:#\t ]+([A-Z0-9-]{3,})\b/i
    ]);
    const dateValue = this.normalizeDate(this.pickFirstMatch(text, [
      /\b(?:Invoice\s+Date|PO\s+Date|Review\s+Date|Date)\b(?:\s*[:\t]\s*|\s{2,})([^\n]+)/i,
      /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/i,
      /\b\d{4}[-/]\d{2}[-/]\d{2}\b/,
      /\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/
    ]));
    const amount = this.parseAmount(this.pickFirstMatch(text, [
      /\b(?:Total(?:\s+Due)?|Total\s+Price|Amount\s+Due|Funding\s+Request)\s*[:\t ]+\$?\s*([0-9]+(?:[.,][0-9]{1,2})?)\b/i,
      /\$\s*([0-9]+(?:[.,][0-9]{1,2})?)\b/
    ]));
    const currency = this.pickFirstMatch(text, [
      /\b(USD|EUR|INR|GBP|AUD|CAD|SGD)\b/i
    ]).toUpperCase() || (text.includes('$') ? 'USD' : '');

    const startupName = (toIndex >= 0 ? lines[toIndex + 1] : '') || this.pickFirstMatch(text, [
      /\b(?:Startup|Bill\s*To|Customer|Applicant)\s*[:\t ]+([^\n]+)/i
    ]);
    const vendorName = (fromIndex >= 0 ? lines[fromIndex + 1] : '') || this.pickFirstMatch(text, [
      /\b(?:Vendor|Supplier|From)\s*[:\t ]+([^\n]+)/i
    ]);
    const founderName = this.pickFirstMatch(text, [
      /\b(?:Founder|Founder\s+Name|Applicant\s+Name)\s*[:\t ]+([^\n]+)/i
    ]);
    const mentorName = this.pickFirstMatch(text, [
      /\b(?:Mentor|Reviewer)\s*[:\t ]+([^\n]+)/i
    ]);
    const programName = this.pickFirstMatch(text, [
      /\b(?:Program|Cohort)\s*[:\t ]+([^\n]+)/i
    ]);

    const common = {
      date: dateValue,
      currency,
      vendor_name: vendorName,
      startup_name: startupName,
      founder_name: founderName,
      mentor_name: mentorName,
      program_name: programName,
      invoice_number: invoiceNumber,
      po_number: poNumber,
      total_amount: amount,
      total_price: amount,
      funding_request: amount,
      raw_excerpt: text.slice(0, 900)
    };

    if (category === 'MOU') {
      common.party_one = this.pickFirstMatch(text, [/\b(?:Party\s*1|Party\s*One)\s*[:\t ]+([^\n]+)/i]);
      common.party_two = this.pickFirstMatch(text, [/\b(?:Party\s*2|Party\s*Two)\s*[:\t ]+([^\n]+)/i]);
      common.effective_date = dateValue;
    }

    return common;
  }

  ensureRequiredFields(data, documentType) {
    const template = templateCatalogService.getByType(documentType);
    const requiredFields = template?.rules?.required_fields || [];
    requiredFields.forEach((field) => {
      if (data[field] === null || data[field] === undefined || String(data[field]).trim() === '') {
        data[field] = '';
      }
    });
    return data;
  }

  extractData(rawText) {
    const category = this.detectCategory(rawText);
    const config = categoryMappings[category] || categoryMappings['General Document'];
    const defaults = { ...(config?.defaults || {}) };
    const extracted = this.extractKnownFields(rawText, category);
    const merged = this.sanitizeValue({
      ...defaults,
      ...Object.fromEntries(
        Object.entries(extracted).filter(([, value]) => value !== '')
      )
    });

    const templateType = config?.template_type || category;
    const complete = this.ensureRequiredFields(merged, templateType);

    return {
      document_type: templateType,
      confidence_score: 0.99,
      layout_hint: /invoice|purchase order/i.test(templateType) ? 'tabular' : 'sectioned',
      data: complete,
      summary: `Mock extraction mapped from OCR text for ${templateType}.`,
      template_match_prompt: `${templateType} template with mapped mock payload`,
      extraction_mode: 'mock'
    };
  }
}

module.exports = new MockExtractionService();
