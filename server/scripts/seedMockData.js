/**
 * scripts/seedMockData.js
 *
 * Run with:  node scripts/seedMockData.js
 *
 * Does two things:
 *  1. Generates 5 real .docx templates in server/templates/
 *  2. Seeds mock documents in all statuses into Supabase (or the memory store
 *     if Supabase is unavailable) via the lifecycle service.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const path  = require('path');
const fs    = require('fs');
const PizZip = require('pizzip');

// ---------------------------------------------------------------------------
// 1.  DOCX TEMPLATE GENERATOR
//     Builds minimal but valid .docx files from raw WordprocessingML.
//     Placeholders use {tag} syntax (docxtemplater default).
// ---------------------------------------------------------------------------

function makeParagraph(text, bold = false, size = 24) {
  const rPr = `<w:rPr>${bold ? '<w:b/>' : ''}<w:sz w:val="${size}"/></w:rPr>`;
  return `<w:p><w:r>${rPr}<w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function makePlaceholderParagraph(label, tag) {
  return `<w:p>
  <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${xmlEscape(label)}: </w:t></w:r>
  <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">{${tag}}</w:t></w:r>
</w:p>`;
}

function xmlEscape(v) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function buildDocxBuffer(titleText, sections) {
  const paragraphs = [
    makeParagraph(titleText, true, 32),
    `<w:p><w:r><w:t></w:t></w:r></w:p>`,
  ];

  sections.forEach(({ heading, fields }) => {
    paragraphs.push(makeParagraph(heading, true, 26));
    fields.forEach(({ label, tag }) => {
      paragraphs.push(makePlaceholderParagraph(label, tag));
    });
    paragraphs.push(`<w:p><w:r><w:t></w:t></w:r></w:p>`);
  });

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join('\n    ')}
    <w:sectPr/>
  </w:body>
</w:document>`;

  const zip = new PizZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.folder('word').file('document.xml', docXml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

const TEMPLATES = [
  {
    file: 'startup-grant-application.docx',
    title: 'Startup Grant Application',
    sections: [
      { heading: 'Startup Profile', fields: [
        { label: 'Startup Name',      tag: 'startup_name' },
        { label: 'Founder Name',      tag: 'founder_name' },
        { label: 'Program Name',      tag: 'program_name' },
        { label: 'Contact Email',     tag: 'contact_email' },
        { label: 'Contact Phone',     tag: 'contact_phone' },
      ]},
      { heading: 'Funding Request', fields: [
        { label: 'Funding Amount',    tag: 'funding_request' },
        { label: 'Currency',          tag: 'currency' },
        { label: 'Use of Funds',      tag: 'use_of_funds' },
        { label: 'Disbursement Date', tag: 'requested_disbursement_date' },
      ]},
      { heading: 'Business Case', fields: [
        { label: 'Problem Statement', tag: 'problem_statement' },
        { label: 'Solution Summary',  tag: 'solution_summary' },
        { label: 'Traction',          tag: 'traction' },
        { label: 'Mentor Notes',      tag: 'mentor_notes' },
      ]},
    ]
  },
  {
    file: 'mentor-review-memo.docx',
    title: 'Mentor Review Memo',
    sections: [
      { heading: 'Review Details', fields: [
        { label: 'Startup Name',    tag: 'startup_name' },
        { label: 'Mentor Name',     tag: 'mentor_name' },
        { label: 'Review Date',     tag: 'review_date' },
        { label: 'Reviewer Email',  tag: 'reviewer_email' },
      ]},
      { heading: 'Assessment', fields: [
        { label: 'Strengths',       tag: 'strengths' },
        { label: 'Risks',           tag: 'risks' },
        { label: 'Recommendation',  tag: 'recommendation' },
      ]},
    ]
  },
  {
    file: 'institutional-mou.docx',
    title: 'Memorandum of Understanding',
    sections: [
      { heading: 'Parties', fields: [
        { label: 'Party One',        tag: 'party_one' },
        { label: 'Party Two',        tag: 'party_two' },
        { label: 'Effective Date',   tag: 'effective_date' },
      ]},
      { heading: 'Agreement', fields: [
        { label: 'Purpose',          tag: 'purpose' },
        { label: 'Obligations',      tag: 'obligations' },
        { label: 'Duration',         tag: 'duration' },
        { label: 'Governing Law',    tag: 'governing_law' },
      ]},
    ]
  },
  {
    file: 'smartdoc-branded-invoice.docx',
    title: 'Standard Invoice',
    sections: [
      { heading: 'Invoice Details', fields: [
        { label: 'Invoice Number',   tag: 'invoice_number' },
        { label: 'Date',             tag: 'date' },
        { label: 'Due Date',         tag: 'due_date' },
        { label: 'Currency',         tag: 'currency' },
      ]},
      { heading: 'Vendor', fields: [
        { label: 'Vendor Name',      tag: 'vendor_name' },
        { label: 'Vendor Address',   tag: 'vendor_address' },
        { label: 'Vendor Email',     tag: 'vendor_email' },
      ]},
      { heading: 'Billing', fields: [
        { label: 'Client Name',      tag: 'client_name' },
        { label: 'Description',      tag: 'description' },
        { label: 'Subtotal',         tag: 'subtotal' },
        { label: 'Tax',              tag: 'tax' },
        { label: 'Total Amount',     tag: 'total_amount' },
      ]},
    ]
  },
  {
    file: 'po-template.docx',
    title: 'Bulk Purchase Order',
    sections: [
      { heading: 'Order Info', fields: [
        { label: 'PO Number',        tag: 'po_number' },
        { label: 'Date',             tag: 'date' },
        { label: 'Department',       tag: 'department' },
      ]},
      { heading: 'Supplier', fields: [
        { label: 'Supplier Name',    tag: 'supplier_name' },
        { label: 'Supplier Contact', tag: 'supplier_contact' },
      ]},
      { heading: 'Delivery', fields: [
        { label: 'Shipping Address', tag: 'shipping_address' },
        { label: 'Items',            tag: 'items' },
        { label: 'Total Price',      tag: 'total_price' },
        { label: 'Notes',            tag: 'notes' },
      ]},
    ]
  },
];

function generateTemplates() {
  const templatesDir = path.resolve(__dirname, '../templates');
  if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });

  let created = 0;
  for (const tpl of TEMPLATES) {
    const dest = path.join(templatesDir, tpl.file);
    if (fs.existsSync(dest)) {
      console.log(`  ⏭  Skipped (exists): ${tpl.file}`);
      continue;
    }
    const buf = buildDocxBuffer(tpl.title, tpl.sections);
    fs.writeFileSync(dest, buf);
    console.log(`  ✅ Created: ${tpl.file}`);
    created++;
  }
  return created;
}

// ---------------------------------------------------------------------------
// 2.  MOCK DOCUMENT SEEDER
// ---------------------------------------------------------------------------

const lifecycleService = require('../services/documentLifecycleServiceV2');

const TODAY = new Date().toISOString();

const MOCK_DOCS = [
  // --- pending_admin ---
  {
    created_by: 2, created_by_name: 'Aarav Sharma', creator_role: 'startup',
    original_file: 'grant-application-aarav.pdf',
    status: 'pending_admin',
    document_type: 'Grant Application',
    template_name: 'startup-grant-application.docx', template_id: 't1',
    department: 'Finance',
    summary: 'Startup grant request of ₹5L for product development and team expansion.',
    extracted_json: {
      startup_name: 'NexaAI Solutions',
      founder_name: 'Aarav Sharma',
      program_name: 'Cohort 9 Accelerator',
      contact_email: 'aarav@nexaai.in',
      contact_phone: '+91-98765-43210',
      funding_request: '500000',
      currency: 'INR',
      use_of_funds: 'Product development, cloud infra, team hiring',
      problem_statement: 'SMEs lack affordable AI-powered document workflows.',
      solution_summary: 'SmartDoc AI – automated document extraction and generation.',
      traction: '12 pilot clients, ₹2.4L ARR',
      mentor_notes: 'Strong product-market fit, needs go-to-market refinement.'
    },
    review_comments: 'AI audit flag: verify "traction" figures against attached pitch deck.',
    verification_report: { approved: false, confidence: 0.78, issues: ['Traction metrics unverified'] },
    validation_report: { passed: true, issues: [] },
  },
  // --- pending_admin (2nd) ---
  {
    created_by: 3, created_by_name: 'Priya Menon', creator_role: 'mentor',
    original_file: 'review-memo-priya.pdf',
    status: 'pending_admin',
    document_type: 'Review Memo',
    template_name: 'mentor-review-memo.docx', template_id: 't2',
    department: 'Programs',
    summary: 'Mentor review memo for NexaAI Solutions – Cohort 9.',
    extracted_json: {
      startup_name: 'NexaAI Solutions',
      mentor_name: 'Priya Menon',
      review_date: '2026-04-10',
      reviewer_email: 'priya@incubator.in',
      strengths: 'Clear vision, technical depth, repeat founder',
      risks: 'Market crowded; differentiation needs sharpening',
      recommendation: 'Advance to final demo stage with conditions'
    },
    review_comments: null,
    verification_report: { approved: true, confidence: 0.92, issues: [] },
    validation_report: { passed: true, issues: [] },
  },
  // --- approved ---
  {
    created_by: 2, created_by_name: 'Aarav Sharma', creator_role: 'startup',
    original_file: 'invoice-march-2026.pdf',
    status: 'approved',
    document_type: 'Invoice',
    template_name: 'smartdoc-branded-invoice.docx', template_id: 't4',
    department: 'Finance',
    approved_by: 1,
    summary: 'March services invoice from VendorX to NexaAI Solutions.',
    extracted_json: {
      invoice_number: 'INV-2026-0031',
      date: '2026-03-31',
      due_date: '2026-04-15',
      currency: 'INR',
      vendor_name: 'VendorX Pvt Ltd',
      vendor_address: '12 MG Road, Bengaluru 560001',
      vendor_email: 'billing@vendorx.in',
      client_name: 'NexaAI Solutions',
      description: 'Cloud infrastructure services — March 2026',
      subtotal: '42000',
      tax: '7560',
      total_amount: '49560'
    },
    review_comments: null,
    artifacts: { final_docx: null },      // will be set after approval in production
    verification_report: { approved: true, confidence: 0.97, issues: [] },
    validation_report: { passed: true, issues: [] },
  },
  // --- rejected ---
  {
    created_by: 2, created_by_name: 'Aarav Sharma', creator_role: 'startup',
    original_file: 'mou-draft-nexaai.pdf',
    status: 'rejected',
    document_type: 'MOU',
    template_name: 'institutional-mou.docx', template_id: 't3',
    department: 'Legal',
    summary: 'MOU draft between NexaAI Solutions and SIDBI Innovation.',
    extracted_json: {
      party_one: 'NexaAI Solutions Pvt Ltd',
      party_two: 'SIDBI Innovation and Incubation Centre',
      effective_date: '2026-05-01',
      purpose: 'Joint acceleration and grant disbursement program',
      obligations: 'Quarterly reporting, IP sharing terms, milestone reviews',
      duration: '24 months',
      governing_law: 'India'
    },
    review_comments: 'Rejected: IP sharing clause requires legal review before acceptance. Resubmit with revised Section 4.',
    verification_report: { approved: false, confidence: 0.61, issues: ['IP clause ambiguous', 'Effective date conflicts with program calendar'] },
    validation_report: { passed: false, issues: ['obligations field incomplete'] },
  },
  // --- dispatched ---
  {
    created_by: 3, created_by_name: 'Priya Menon', creator_role: 'mentor',
    original_file: 'po-equipment-q1.pdf',
    status: 'dispatched',
    document_type: 'Purchase Order',
    template_name: 'po-template.docx', template_id: 't5',
    department: 'Operations',
    approved_by: 1,
    summary: 'Q1 equipment purchase order for lab hardware.',
    extracted_json: {
      po_number: 'PO-2026-Q1-007',
      date: '2026-01-15',
      department: 'Operations',
      supplier_name: 'TechEquip Distributors',
      supplier_contact: 'orders@techequip.in',
      shipping_address: 'SmartDoc Incubator, 4th Floor, Koramangala, Bengaluru',
      items: 'Dell XPS 15 × 3, 4K Monitors × 5, Cisco Switch × 1',
      total_price: '325000 INR',
      notes: 'Priority delivery — required before Feb 1 2026'
    },
    review_comments: null,
    artifacts: { final_docx: null, dispatch: { channel: 'email', dispatched_at: TODAY } },
    verification_report: { approved: true, confidence: 0.95, issues: [] },
    validation_report: { passed: true, issues: [] },
  },
  // --- flagged ---
  {
    created_by: 2, created_by_name: 'Aarav Sharma', creator_role: 'startup',
    original_file: 'grant-application-second.pdf',
    status: 'flagged',
    document_type: 'Grant Application',
    template_name: 'startup-grant-application.docx', template_id: 't1',
    department: 'Finance',
    summary: 'Second grant tranche application — amounts inconsistent.',
    extracted_json: {
      startup_name: 'NexaAI Solutions',
      founder_name: 'Aarav Sharma',
      program_name: 'Cohort 9 — Tranche 2',
      funding_request: '750000',
      currency: 'INR',
      problem_statement: 'Scale product to 50 clients by Q3 2026',
      solution_summary: 'Accelerated go-to-market with channel partners',
    },
    review_comments: 'Flagged by admin for manual corrections: funding amount exceeds pre-approved ceiling of ₹6L.',
    verification_report: { approved: false, confidence: 0.55, issues: ['Amount exceeds ceiling'] },
    validation_report: { passed: true, issues: [] },
  },
];

async function seedDocuments() {
  console.log('\n📄 Seeding mock documents...');
  let count = 0;
  for (const mockDoc of MOCK_DOCS) {
    const { history_note: _, ...payload } = mockDoc; // strip virtual field just in case
    const base = {
      created_by:      payload.created_by,
      created_by_name: payload.created_by_name,
      creator_role:    payload.creator_role,
      original_file:   payload.original_file,
      status:          'uploaded',
    };
    let doc = await lifecycleService.createDocument(base);

    // Apply the full state as a single update (history_note drives the timeline entry)
    doc = await lifecycleService.updateDocument(doc.id, {
      ...payload,
      history_note: `Mock seed — ${payload.status}`,
    });

    console.log(`  ✅ [${payload.status.padEnd(14)}] ${payload.original_file}  (id: ${String(doc.id).slice(0,8)})`);
    count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// 3.  MAIN
// ---------------------------------------------------------------------------

(async () => {
  console.log('\n🚀 SmartDoc-AI — Mock Data Seeder\n');

  console.log('📁 Generating DOCX templates...');
  const templatesCreated = generateTemplates();
  console.log(`   → ${templatesCreated} template(s) written\n`);

  const docsCreated = await seedDocuments();
  console.log(`\n✅ Done — ${docsCreated} mock document(s) seeded across all status tabs.\n`);
  process.exit(0);
})();
