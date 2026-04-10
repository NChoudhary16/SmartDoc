const templateCatalogService = require('./templateCatalogService');

class DocumentValidationService {
  isBlank(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  validateDateFormat(value, expectedFormat) {
    if (!value || expectedFormat !== 'YYYY-MM-DD') return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value).trim());
  }

  buildSuggestions(missingFields, dateWarnings, data) {
    const suggestions = [];
    if (missingFields.length) {
      suggestions.push(`Populate required fields: ${missingFields.join(', ')}`);
    }
    if (dateWarnings.length) {
      suggestions.push('Normalize all dates to YYYY-MM-DD before final approval.');
    }
    if (!data || Object.keys(data).length < 3) {
      suggestions.push('Run manual enrichment or mentor review because extraction returned limited structured data.');
    }
    return suggestions;
  }

  validate({ data, template, documentType }) {
    const normalizedTemplate =
      templateCatalogService.normalizeTemplate(template) ||
      templateCatalogService.getByType(documentType) ||
      null;

    const rules = normalizedTemplate?.rules || {};
    const requiredFields = Array.isArray(rules.required_fields) ? rules.required_fields : [];
    const payload = data && typeof data === 'object' ? data : {};

    const missingFields = requiredFields.filter((field) => this.isBlank(payload[field]));
    const dateWarnings = Object.entries(payload)
      .filter(([key, value]) => /date/i.test(key) && !this.validateDateFormat(value, rules.preferred_date_format))
      .map(([key]) => `${key} should use ${rules.preferred_date_format}`);

    const issues = [
      ...missingFields.map((field) => `Required field missing: ${field}`),
      ...dateWarnings
    ];

    return {
      passed: issues.length === 0,
      score: requiredFields.length
        ? Number(((requiredFields.length - missingFields.length) / requiredFields.length).toFixed(2))
        : issues.length === 0 ? 1 : 0.5,
      template_id: normalizedTemplate?.id || null,
      template_name: normalizedTemplate?.name || null,
      document_type: documentType || normalizedTemplate?.type || null,
      editable_output_formats: normalizedTemplate?.supported_output_formats || ['docx'],
      missing_fields: missingFields,
      issues,
      standards: {
        preferred_date_format: rules.preferred_date_format || 'YYYY-MM-DD',
        numbering_style: rules.numbering_style || 'institutional',
        editable: rules.editable !== false
      },
      suggestions: this.buildSuggestions(missingFields, dateWarnings, payload)
    };
  }
}

module.exports = new DocumentValidationService();
