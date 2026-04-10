const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs');
const ragService = require('./services/ragServiceV2');
const supabase = require('./utils/supabaseClient'); // Direct supabase client

// Ensure templates directory exists
const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

const templatesToSeed = [
  {
    name: 'Standard Invoice',
    type: 'Invoice',
    description: 'A standard invoice template with fields for invoice_number, date, vendor_name, total_amount, currency, and line_items. Use this for general billing.',
    file_path: 'invoice-template.docx' // You will need to put this file in the templates/ folder
  },
  {
    name: 'Bulk Purchase Order',
    type: 'Purchase Order',
    description: 'Purchase order template detailing items, quantities, shipping address, po_number, and total_price. Suitable for B2B supply requests.',
    file_path: 'po-template.docx'
  },
  {
    name: 'Memorandum of Understanding (MOU)',
    type: 'MOU',
    description: 'Legal MOU contract template outlining parties, effective_date, purpose, and key_clauses. Used for formal agreements.',
    file_path: 'mou-template.docx'
  }
];

async function seedTemplates() {
  console.log('🌱 Starting Template Seeding Script...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase credentials in .env');
      return;
  }

  if(!process.env.OPENAI_API_KEY) {
      console.error('❌ Missing OPENAI_API_KEY in .env (needed for embeddings)');
      return;
  }

  const { error: clearError } = await supabase.from('document_templates').delete().not('id', 'is', null);
  if (clearError) {
    console.warn('⚠️  Could not clear document_templates (table may not exist yet):', clearError.message);
  } else {
    console.log('🗑️  Cleared existing document_templates rows before seed.');
  }

  for (const template of templatesToSeed) {
    try {
      console.log(`\nProcessing: ${template.name}...`);
      
      // We will create dummy files just so the file paths are valid if you test the generator later.
      // You should replace these with your ACTUAL docxtemplater files.
      const fullPath = path.join(templatesDir, template.file_path);
      if (!fs.existsSync(fullPath)) {
        console.log(`  Creating dummy file in templates/${template.file_path} (Replace with real template later)`);
        fs.writeFileSync(fullPath, 'This is a dummy template. Please replace me with a real .docx file containing {tags}.');
      }

      console.log(`  Generating embeddings for description...`);
      // We assume ragService.addTemplate handles both embedding generation and DB insertion
      const data = await ragService.addTemplate(template);
      console.log(`  ✅ Successfully seeded: ${template.name}`);
      
    } catch (error) {
      console.error(`  ❌ Failed to seed ${template.name}:`, error.message || error);
    }
  }

  console.log('\n✅ Seeding complete!');
}

seedTemplates();

