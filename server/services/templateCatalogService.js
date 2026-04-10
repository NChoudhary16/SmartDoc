const templateCatalog = [
  {
    id: 't1',
    name: 'Startup Grant Application',
    type: 'Grant Application',
    description: 'Institutional grant application template for accelerator startups with compliance-ready sections.',
    file_path: 'startup-grant-application.docx',
    manifest_file: 'startup-grant-application.json',
    supported_output_formats: ['docx', 'pdf'],
    audience: ['startup', 'mentor', 'admin'],
    rules: {
      required_fields: ['startup_name', 'founder_name', 'program_name', 'funding_request', 'problem_statement'],
      preferred_date_format: 'YYYY-MM-DD',
      numbering_style: 'institutional-heading',
      editable: true
    }
  },
  {
    id: 't2',
    name: 'Mentor Review Memo',
    type: 'Review Memo',
    description: 'Standard review memo used by mentors to validate startup submissions and recommendations.',
    file_path: 'mentor-review-memo.docx',
    manifest_file: 'mentor-review-memo.json',
    supported_output_formats: ['docx', 'pdf'],
    audience: ['mentor', 'admin'],
    rules: {
      required_fields: ['startup_name', 'mentor_name', 'review_date', 'strengths', 'risks', 'recommendation'],
      preferred_date_format: 'YYYY-MM-DD',
      numbering_style: 'sectioned-memo',
      editable: true
    }
  },
  {
    id: 't3',
    name: 'Institutional MOU',
    type: 'MOU',
    description: 'Memorandum of understanding template with signature, effective date, and obligations sections.',
    file_path: 'institutional-mou.docx',
    manifest_file: 'institutional-mou.json',
    supported_output_formats: ['docx', 'pdf'],
    audience: ['startup', 'admin'],
    rules: {
      required_fields: ['party_one', 'party_two', 'effective_date', 'purpose', 'obligations'],
      preferred_date_format: 'YYYY-MM-DD',
      numbering_style: 'legal-clause',
      editable: true
    }
  },
  {
    id: 't4',
    name: 'Standard Invoice',
    type: 'Invoice',
    description: 'Standard corporate invoice with tax and vendor format requirements.',
    file_path: 'invoice-template.docx',
    manifest_file: 'invoice-template.json',
    supported_output_formats: ['docx', 'pdf'],
    audience: ['startup', 'admin'],
    rules: {
      required_fields: ['invoice_number', 'date', 'vendor_name', 'total_amount', 'currency'],
      preferred_date_format: 'YYYY-MM-DD',
      numbering_style: 'financial-table',
      editable: true
    }
  },
  {
    id: 't5',
    name: 'Bulk Purchase Order',
    type: 'Purchase Order',
    description: 'Detailed purchase order template for institutional procurement workflows.',
    file_path: 'po-template.docx',
    manifest_file: 'po-template.json',
    supported_output_formats: ['docx', 'pdf'],
    audience: ['startup', 'admin'],
    rules: {
      required_fields: ['po_number', 'date', 'shipping_address', 'items', 'total_price'],
      preferred_date_format: 'YYYY-MM-DD',
      numbering_style: 'procurement-table',
      editable: true
    }
  }
];

class TemplateCatalogService {
  list() {
    return templateCatalog.map((template) => ({ ...template }));
  }

  getById(id) {
    return templateCatalog.find((template) => template.id === id) || null;
  }

  getByFilePath(filePath) {
    return templateCatalog.find((template) => template.file_path === filePath) || null;
  }

  getByType(type) {
    const normalized = String(type || '').toLowerCase();
    return templateCatalog.find((template) => template.type.toLowerCase() === normalized) || null;
  }

  normalizeTemplate(template) {
    if (!template) return null;
    const catalogEntry =
      this.getById(template.id) ||
      this.getByFilePath(template.file_path) ||
      this.getByType(template.type);

    return {
      ...catalogEntry,
      ...template,
      supported_output_formats:
        template.supported_output_formats ||
        catalogEntry?.supported_output_formats ||
        ['docx'],
      rules: {
        ...(catalogEntry?.rules || {}),
        ...(template.rules || {})
      }
    };
  }
}

module.exports = new TemplateCatalogService();
