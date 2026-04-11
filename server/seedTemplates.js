const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs');
const ragService = require('./services/ragServiceV2');
const supabase = require('./utils/supabaseClient');

const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

const templatesToSeed = [
  {
    name: 'Standard Invoice',
    type: 'Invoice',
    description:
      'SmartDoc-branded invoice DOCX (sidebar, line table, totals bar). Fields: invoice_number, date, vendor_name, bill_to, total_amount, currency, line_items.',
    file_path: 'smartdoc-branded-invoice.docx'
  },
  {
    name: 'Bulk Purchase Order',
    type: 'Purchase Order',
    description:
      'Purchase order template detailing items, quantities, shipping address, po_number, and total_price. Suitable for B2B supply requests.',
    file_path: 'po-template.docx'
  },
  {
    name: 'Memorandum of Understanding (MOU)',
    type: 'MOU',
    description:
      'Legal MOU contract template outlining parties, effective_date, purpose, and key_clauses. Used for formal agreements.',
    file_path: 'institutional-mou.docx'
  }
];

async function seedTemplates() {
  console.log('[seed] Starting template seeding');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('[seed] Missing Supabase credentials in .env');
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('[seed] Missing GEMINI_API_KEY in .env (needed for embeddings)');
    return;
  }

  const { error: clearError } = await supabase
    .from('document_templates')
    .delete()
    .not('id', 'is', null);

  if (clearError) {
    console.warn('[seed] Could not clear document_templates:', clearError.message);
  } else {
    console.log('[seed] Cleared existing document_templates rows');
  }

  for (const template of templatesToSeed) {
    try {
      console.log(`[seed] Processing: ${template.name}`);

      const fullPath = path.join(templatesDir, template.file_path);
      if (!fs.existsSync(fullPath)) {
        console.log(`[seed] Creating placeholder template file templates/${template.file_path}`);
        fs.writeFileSync(
          fullPath,
          'Placeholder template file. Replace with a real .docx containing docxtemplater tags.'
        );
      }

      await ragService.addTemplate(template);
      console.log(`[seed] Seeded: ${template.name}`);
    } catch (error) {
      console.error(`[seed] Failed: ${template.name}:`, error.message || error);
    }
  }

  console.log('[seed] Seeding complete');
}

seedTemplates();
