const supabase = require('../utils/supabaseClient');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fallback templates when Supabase is unavailable
const localTemplates = [
  { id: 't1', name: 'Standard Invoice', type: 'Invoice', description: 'Standard corporate invoice with VAT', file_path: 'invoice-template.docx' },
  { id: 't2', name: 'Memorandum of Understanding', type: 'MOU', description: 'MOU between two parties', file_path: 'mou-template.docx' },
  { id: 't3', name: 'Bulk Purchase Order', type: 'Purchase Order', description: 'Detailed PO for bulk orders', file_path: 'po-template.docx' },
];

class RAGService {
  constructor() {
    try {
      this.embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    } catch (e) {
      console.warn('⚠️  Could not initialize embedding model:', e.message);
      this.embedModel = null;
    }
  }

  async generateEmbedding(text) {
    if (!this.embedModel) return null;
    const result = await this.embedModel.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Match a template. Uses Supabase vector search if available, otherwise keyword fallback.
   */
  async matchTemplate(extractedData, matchPrompt) {
    // --- Strategy 1: Supabase Vector Search ---
    if (supabase) {
      try {
        const embedding = await this.generateEmbedding(matchPrompt || JSON.stringify(extractedData));
        if (embedding) {
          const { data: templates, error } = await supabase.rpc('match_templates', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 1,
          });
          if (!error && templates && templates.length > 0) {
            console.log('✅ Matched template via Vector DB:', templates[0].name);
            return templates[0];
          }
        }
      } catch (error) {
        console.warn('⚠️  Vector search failed, using keyword fallback:', error.message);
      }
    }

    // --- Strategy 2: Simple keyword fallback ---
    const docType = (extractedData?.document_type || '').toLowerCase();
    const match = localTemplates.find(t => docType.includes(t.type.toLowerCase()));
    const result = match || localTemplates[0];
    console.log('📋 Matched template via keyword fallback:', result.name);
    return result;
  }

  async addTemplate(templateData) {
    if (!supabase) {
      console.warn('⚠️  Supabase not connected. Cannot add template to Vector DB.');
      return null;
    }
    const { name, type, description, file_path } = templateData;
    const embedding = await this.generateEmbedding(description);
    const { data, error } = await supabase
      .from('document_templates')
      .insert([{ name, type, description, file_path, embedding }]);
    if (error) throw error;
    return data;
  }
}

module.exports = new RAGService();
