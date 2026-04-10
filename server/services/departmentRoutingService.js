/**
 * Routes approved DOCX deliveries to internal departments from document / template category.
 * Keys must exist in dispatchService.departmentEmailMap (or DEFAULT_DEPARTMENT_EMAIL).
 */

function normalizeType(documentType, template) {
  const parts = [
    documentType,
    template?.type,
    template?.name,
    template?.file_path
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  return parts.join(' ');
}

function resolveDepartment({ documentType, template, extractedData } = {}) {
  const fromPayload =
    (extractedData && (extractedData.target_department || extractedData.department)) || null;
  if (fromPayload && String(fromPayload).trim()) {
    return String(fromPayload).trim().toLowerCase();
  }

  const haystack = normalizeType(documentType, template);

  if (/(invoice|billing|tax|vat|receipt|payment due)/.test(haystack)) return 'finance';
  if (/(purchase order|\bpo\b|procurement|vendor quote|rfq)/.test(haystack)) return 'procurement';
  if (/(mou|memorandum|contract|legal|counsel|agreement|clause)/.test(haystack)) return 'legal';
  if (/(grant|application|accelerator|cohort)/.test(haystack)) return 'operations';

  return 'operations';
}

module.exports = {
  resolveDepartment
};
