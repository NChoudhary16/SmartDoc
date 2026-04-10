const supabase = require('../utils/supabaseClient');
const path = require('path');
const templateCatalogService = require('./templateCatalogService');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
const OPENAI_EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_DIM = Number(process.env.OPENAI_EMBED_DIMENSIONS || 768);

class RAGServiceV2 {
  async generateEmbedding(text) {
    if (!OPENAI_API_KEY) return null;
    const input = String(text || '').trim();
    if (!input) return null;

    try {
      const response = await fetch(`${OPENAI_API_URL}/embeddings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_EMBED_MODEL,
          input: input.slice(0, 8000),
          dimensions: EMBEDDING_DIM
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          payload?.error?.message ||
          payload?.detail ||
          payload?.message ||
          `OpenAI embeddings failed (${response.status})`;
        throw new Error(message);
      }

      const values = payload?.data?.[0]?.embedding;
      if (!values?.length) return null;
      if (values.length !== EMBEDDING_DIM) {
        console.warn(`RAG: embedding length ${values.length} (expected ${EMBEDDING_DIM})`);
      }
      return values;
    } catch (error) {
      console.warn('RAG embedding failed:', error.message || error);
      return null;
    }
  }

  /**
   * Match a DOCX template using vector DB + optional category (document type) filter.
   * @param {object} extractionPayload - LLM extraction (document_type, data, …)
   * @param {string} matchPrompt - template_match_prompt from extraction
   * @param {{ ocrText?: string }} [options] - OCR text from the upload (preferred for embedding)
   */
  async matchTemplate(extractionPayload, matchPrompt, options = {}) {
    const extractedData = extractionPayload?.data || extractionPayload || {};
    const detectedDocType =
      extractionPayload?.document_type || extractedData?.document_type || '';

    const ocrSnippet = String(options.ocrText || '').trim().slice(0, 6000);
    const promptPart = String(matchPrompt || JSON.stringify(extractedData)).trim().slice(0, 2000);
    const embeddingText =
      ocrSnippet.length > 200 ? `${ocrSnippet}\n---\n${promptPart}` : promptPart;

    if (supabase && embeddingText.length > 10) {
      try {
        const embedding = await this.generateEmbedding(embeddingText);
        if (embedding) {
          const typeFilter = String(detectedDocType || '').trim() || null;

          if (typeFilter) {
            for (const matchThreshold of [0.34, 0.26]) {
              const { data: templates, error } = await supabase.rpc('match_templates', {
                query_embedding: embedding,
                match_threshold: matchThreshold,
                match_count: 3,
                type_filter: typeFilter
              });

              if (error) {
                console.warn('match_templates RPC error (typed):', error.message || error);
                break;
              }

              if (templates?.length) {
                return templateCatalogService.normalizeTemplate(templates[0]);
              }
            }
          }

          for (const matchThreshold of [0.38, 0.26]) {
            const { data: templates, error } = await supabase.rpc('match_templates', {
              query_embedding: embedding,
              match_threshold: matchThreshold,
              match_count: 1,
              type_filter: null
            });

            if (error) {
              console.warn('match_templates RPC error:', error.message || error);
              break;
            }

            if (templates?.length) {
              return templateCatalogService.normalizeTemplate(templates[0]);
            }
          }
        }
      } catch (error) {
        console.warn('Vector search failed, using keyword fallback:', error.message || error);
      }
    }

    const fallback =
      templateCatalogService.getByType(detectedDocType) ||
      templateCatalogService.list()[0];

    return templateCatalogService.normalizeTemplate(fallback);
  }

  async addTemplate(templateData) {
    if (!supabase) {
      return templateCatalogService.normalizeTemplate({
        ...templateData,
        id: `local-${Date.now()}`
      });
    }

    const { name, type, description, file_path } = templateData;
    const embedText = [name, type, description].filter(Boolean).join(' - ');
    const embedding = await this.generateEmbedding(embedText);
    if (!embedding) {
      throw new Error('Could not generate embedding (check OPENAI_API_KEY and model access)');
    }

    const { data, error } = await supabase
      .from('document_templates')
      .insert([{ name, type, description, file_path, embedding }])
      .select()
      .single();

    if (error) throw error;
    return templateCatalogService.normalizeTemplate(data);
  }

  async listTemplates() {
    if (!supabase) {
      return templateCatalogService.list().map((template) => ({
        ...template,
        source: 'local_fallback'
      }));
    }

    const { data, error } = await supabase
      .from('document_templates')
      .select('id, name, type, description, file_path, created_at')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map((row) => ({
      ...templateCatalogService.normalizeTemplate(row),
      source: 'supabase'
    }));
  }
}

module.exports = new RAGServiceV2();
