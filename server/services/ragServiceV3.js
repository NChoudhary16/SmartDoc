const path = require('path');
const dotenv = require('dotenv');
const supabase = require('../utils/supabaseClient');
const templateCatalogService = require('./templateCatalogService');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let GoogleGenerativeAI = null;
try {
  ({ GoogleGenerativeAI } = require('@google/generative-ai'));
} catch {
  GoogleGenerativeAI = null;
}

const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || '').trim();
const OPENAI_API_URL = (process.env.OPENAI_API_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const OPENAI_EMBED_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const OPENAI_EMBED_DIMENSIONS = Number(process.env.OPENAI_EMBED_DIMENSIONS || 768);

const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || '').trim();
const GEMINI_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
const REQUEST_TIMEOUT_MS = Number(process.env.EMBEDDING_TIMEOUT_MS || 20000);

class RAGServiceV3 {
  constructor() {
    this._geminiEmbeddingModel = null;
    this._warnedOpenAI = false;
    this._warnedGemini = false;

    if (GEMINI_API_KEY && GoogleGenerativeAI) {
      this._geminiEmbeddingModel = new GoogleGenerativeAI(GEMINI_API_KEY).getGenerativeModel({
        model: GEMINI_EMBED_MODEL
      });
    }

    const providers = [
      OPENAI_API_KEY ? `openai:${OPENAI_EMBED_MODEL}` : null,
      this._geminiEmbeddingModel ? `gemini:${GEMINI_EMBED_MODEL}` : null,
      'keyword_fallback'
    ].filter(Boolean);
    console.log(`[RAG] embedding providers: ${providers.join(' -> ')}`);
  }

  async _embedWithOpenAI(input) {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const payload = {
        model: OPENAI_EMBED_MODEL,
        input
      };

      if (Number.isFinite(OPENAI_EMBED_DIMENSIONS) && OPENAI_EMBED_DIMENSIONS > 0) {
        payload.dimensions = OPENAI_EMBED_DIMENSIONS;
      }

      const response = await fetch(`${OPENAI_API_URL}/embeddings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const body = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(body);
      } catch {
        parsed = null;
      }

      if (!response.ok) {
        const message = parsed?.error?.message || body || `HTTP ${response.status}`;
        throw new Error(message);
      }

      const embedding = parsed?.data?.[0]?.embedding;
      if (!Array.isArray(embedding) || !embedding.length) {
        throw new Error('OpenAI returned empty embedding');
      }
      return embedding;
    } finally {
      clearTimeout(timeout);
    }
  }

  async _embedWithGemini(input) {
    if (!this._geminiEmbeddingModel) throw new Error('Gemini embedding model not configured');
    const result = await this._geminiEmbeddingModel.embedContent(input);
    const values = result?.embedding?.values;
    if (!Array.isArray(values) || !values.length) throw new Error('Gemini returned empty embedding');
    return values;
  }

  async generateEmbedding(text) {
    const input = String(text || '').trim().slice(0, 8000);
    if (!input) return null;

    if (OPENAI_API_KEY) {
      try {
        return await this._embedWithOpenAI(input);
      } catch (error) {
        if (!this._warnedOpenAI) {
          this._warnedOpenAI = true;
          console.warn('[RAG] OpenAI embedding failed, trying fallback:', error.message || error);
        }
      }
    }

    if (this._geminiEmbeddingModel) {
      try {
        return await this._embedWithGemini(input);
      } catch (error) {
        if (!this._warnedGemini) {
          this._warnedGemini = true;
          console.warn('[RAG] Gemini embedding failed, trying fallback:', error.message || error);
        }
      }
    }

    return null;
  }

  async _vectorMatch(embedding, detectedDocType) {
    if (!supabase || !embedding) return null;

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
          console.warn('[RAG] match_templates RPC error (typed):', error.message || error);
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
        console.warn('[RAG] match_templates RPC error:', error.message || error);
        break;
      }

      if (templates?.length) {
        return templateCatalogService.normalizeTemplate(templates[0]);
      }
    }

    return null;
  }

  async _historicalTemplateFallback(detectedDocType) {
    if (!supabase) return null;

    let query = supabase
      .from('documents')
      .select('template_id, template_name, document_type, updated_at')
      .not('template_name', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (detectedDocType) {
      query = query.ilike('document_type', `%${detectedDocType}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[RAG] historical fallback query failed:', error.message || error);
      return null;
    }

    const row = (data || []).find((item) => item.template_name);
    if (!row) return null;

    return templateCatalogService.normalizeTemplate({
      id: row.template_id || null,
      file_path: row.template_name,
      type: row.document_type || detectedDocType || null
    });
  }

  async matchTemplate(extractionPayload, matchPrompt, options = {}) {
    const extractedData = extractionPayload?.data || extractionPayload || {};
    const detectedDocType = extractionPayload?.document_type || extractedData?.document_type || '';

    const ocrSnippet = String(options.ocrText || '').trim().slice(0, 6000);
    const promptPart = String(matchPrompt || JSON.stringify(extractedData)).trim().slice(0, 2000);
    const embeddingText = ocrSnippet.length > 200 ? `${ocrSnippet}\n---\n${promptPart}` : promptPart;

    if (supabase && embeddingText.length > 10) {
      try {
        const embedding = await this.generateEmbedding(embeddingText);
        if (embedding) {
          const matched = await this._vectorMatch(embedding, detectedDocType);
          if (matched) return matched;
        }
      } catch (error) {
        console.warn('[RAG] vector search failed:', error.message || error);
      }
    }

    const historical = await this._historicalTemplateFallback(detectedDocType);
    if (historical) return historical;

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
      throw new Error('Could not generate embedding (check OPENAI_API_KEY or GEMINI_API_KEY)');
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

module.exports = new RAGServiceV3();
