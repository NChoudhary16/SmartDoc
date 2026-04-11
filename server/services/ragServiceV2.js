const supabase = require('../utils/supabaseClient');
const path = require('path');
const templateCatalogService = require('./templateCatalogService');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_DIM = Number(process.env.RAG_EMBEDDING_DIM || 768);
const EMBED_MODEL_CANDIDATES = (
  process.env.GEMINI_EMBED_MODELS ||
  process.env.GEMINI_EMBED_MODEL ||
  'gemini-embedding-001,text-embedding-004,embedding-001'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const _genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const _embedClientByModel = new Map();
const _unsupportedEmbedModels = new Set();
let _loggedTemplateInfraWarning = false;

class RAGServiceV2 {
  isQuotaError(error) {
    const message = String(error?.message || '').toLowerCase();
    return (
      message.includes('quota') ||
      message.includes('too many requests') ||
      message.includes('rate limit') ||
      message.includes('[429')
    );
  }

  isUnsupportedModelError(error) {
    const message = String(error?.message || '').toLowerCase();
    return (
      message.includes('not found') ||
      message.includes('not supported') ||
      message.includes('unsupported')
    );
  }

  isMissingTemplateInfraError(error) {
    const message = String(error?.message || '').toLowerCase();
    const code = String(error?.code || '').toUpperCase();
    return (
      code === 'PGRST205' ||
      code === '42P01' ||
      (message.includes('schema cache') && message.includes('document_templates')) ||
      (message.includes('relation') && message.includes('document_templates')) ||
      (message.includes('function') && message.includes('match_templates'))
    );
  }

  getEmbedClient(modelName) {
    if (!_genAI) return null;
    if (_embedClientByModel.has(modelName)) {
      return _embedClientByModel.get(modelName);
    }
    const client = _genAI.getGenerativeModel({ model: modelName });
    _embedClientByModel.set(modelName, client);
    return client;
  }

  normalizeEmbedding(values) {
    const vector = Array.isArray(values)
      ? values.map((value) => (Number.isFinite(Number(value)) ? Number(value) : 0))
      : [];

    if (vector.length === EMBEDDING_DIM) return vector;
    if (vector.length > EMBEDDING_DIM) return vector.slice(0, EMBEDDING_DIM);
    if (vector.length < EMBEDDING_DIM) {
      return [...vector, ...new Array(EMBEDDING_DIM - vector.length).fill(0)];
    }
    return vector;
  }

  async tryEmbedWithModel(modelName, inputText) {
    const client = this.getEmbedClient(modelName);
    if (!client) return null;

    const text = String(inputText || '').trim().slice(0, 8000);
    if (!text) return null;

    try {
      const structuredResult = await client.embedContent({
        content: {
          role: 'user',
          parts: [{ text }]
        }
      });
      const values = structuredResult?.embedding?.values;
      if (values?.length) {
        return this.normalizeEmbedding(values);
      }
    } catch (structuredError) {
      if (this.isUnsupportedModelError(structuredError) || this.isQuotaError(structuredError)) {
        throw structuredError;
      }
    }

    const result = await client.embedContent(text);
    const values = result?.embedding?.values;
    if (!values?.length) return null;
    return this.normalizeEmbedding(values);
  }

  async generateEmbedding(text) {
    const input = String(text || '').trim();
    if (!_genAI || !input) return null;

    for (const modelName of EMBED_MODEL_CANDIDATES) {
      if (_unsupportedEmbedModels.has(modelName)) continue;

      try {
        const embedding = await this.tryEmbedWithModel(modelName, input);
        if (embedding?.length) {
          return embedding;
        }
      } catch (error) {
        if (this.isUnsupportedModelError(error)) {
          _unsupportedEmbedModels.add(modelName);
          console.warn(`[RAG] Embedding model unavailable: ${modelName}`);
          continue;
        }

        if (this.isQuotaError(error)) {
          console.warn(`[RAG] Embedding quota exceeded on model ${modelName}`);
          break;
        }

        console.warn(`[RAG] Embedding failed on model ${modelName}:`, error.message || error);
      }
    }

    return null;
  }

  keywordDocTypeFromText(text) {
    const normalized = String(text || '').toLowerCase();
    if (!normalized) return '';

    if (normalized.includes('purchase order') || normalized.includes('po number')) {
      return 'Purchase Order';
    }
    if (normalized.includes('invoice')) {
      return 'Invoice';
    }
    if (normalized.includes('memorandum of understanding') || normalized.includes('mou')) {
      return 'MOU';
    }
    if (normalized.includes('grant') || normalized.includes('funding request')) {
      return 'Grant Application';
    }
    if (normalized.includes('review memo') || normalized.includes('mentor notes')) {
      return 'Review Memo';
    }

    return '';
  }

  resolveDocType(extractionPayload, matchPrompt, ocrText) {
    const extractedData = extractionPayload?.data || extractionPayload || {};

    const fromExtraction = String(
      extractionPayload?.document_type ||
      extractedData?.document_type ||
      ''
    ).trim();

    if (fromExtraction) return fromExtraction;

    const fromPrompt = this.keywordDocTypeFromText(matchPrompt);
    if (fromPrompt) return fromPrompt;

    return this.keywordDocTypeFromText(ocrText);
  }

  async searchTemplatesByEmbedding(embedding, typeFilter) {
    const typedThresholds = [0.34, 0.26];
    const untypedThresholds = [0.38, 0.26];

    if (typeFilter) {
      for (const matchThreshold of typedThresholds) {
        const { data: templates, error } = await supabase.rpc('match_templates', {
          query_embedding: embedding,
          match_threshold: matchThreshold,
          match_count: 3,
          type_filter: typeFilter
        });

        if (error) {
          if (this.isMissingTemplateInfraError(error)) {
            if (!_loggedTemplateInfraWarning) {
              _loggedTemplateInfraWarning = true;
              console.warn('[RAG] Supabase template table/function missing. Falling back to local template catalog.');
            }
            return null;
          }
          console.warn('match_templates RPC error (typed):', error.message || error);
          break;
        }

        if (templates?.length) {
          return templateCatalogService.normalizeTemplate(templates[0]);
        }
      }
    }

    for (const matchThreshold of untypedThresholds) {
      const { data: templates, error } = await supabase.rpc('match_templates', {
        query_embedding: embedding,
        match_threshold: matchThreshold,
        match_count: 1,
        type_filter: null
      });

      if (error) {
        if (this.isMissingTemplateInfraError(error)) {
          if (!_loggedTemplateInfraWarning) {
            _loggedTemplateInfraWarning = true;
            console.warn('[RAG] Supabase template table/function missing. Falling back to local template catalog.');
          }
          return null;
        }
        console.warn('match_templates RPC error:', error.message || error);
        break;
      }

      if (templates?.length) {
        return templateCatalogService.normalizeTemplate(templates[0]);
      }
    }

    return null;
  }

  /**
   * Match a DOCX template using vector DB + optional category (document type) filter.
   * @param {object} extractionPayload - LLM extraction (document_type, data, etc.)
   * @param {string} matchPrompt - template_match_prompt from extraction
   * @param {{ ocrText?: string }} [options] - OCR text from the upload (preferred for embedding)
   */
  async matchTemplate(extractionPayload, matchPrompt, options = {}) {
    const extractedData = extractionPayload?.data || extractionPayload || {};
    const detectedDocType = this.resolveDocType(extractionPayload, matchPrompt, options.ocrText || '');

    const ocrSnippet = String(options.ocrText || '').trim().slice(0, 6000);
    const promptPart = String(matchPrompt || JSON.stringify(extractedData)).trim().slice(0, 2000);
    const embeddingText =
      ocrSnippet.length > 200 ? `${ocrSnippet}\n---\n${promptPart}` : promptPart;

    if (supabase && embeddingText.length > 10) {
      try {
        const embedding = await this.generateEmbedding(embeddingText);
        if (embedding) {
          const typeFilter = String(detectedDocType || '').trim() || null;
          const matched = await this.searchTemplatesByEmbedding(embedding, typeFilter);
          if (matched) return matched;
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
      throw new Error('Could not generate embedding (check GEMINI_API_KEY, quota, and embed model access)');
    }

    const { data, error } = await supabase
      .from('document_templates')
      .insert([{ name, type, description, file_path, embedding }])
      .select()
      .single();

    if (error) {
      if (this.isMissingTemplateInfraError(error)) {
        if (!_loggedTemplateInfraWarning) {
          _loggedTemplateInfraWarning = true;
          console.warn('[RAG] Supabase template table missing, storing template in local fallback only.');
        }
        return templateCatalogService.normalizeTemplate({
          ...templateData,
          id: `local-${Date.now()}`
        });
      }
      throw error;
    }

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

    if (error) {
      if (this.isMissingTemplateInfraError(error)) {
        if (!_loggedTemplateInfraWarning) {
          _loggedTemplateInfraWarning = true;
          console.warn('[RAG] Supabase template table missing. Returning local fallback templates.');
        }
        return templateCatalogService.list().map((template) => ({
          ...template,
          source: 'local_fallback'
        }));
      }
      throw error;
    }

    return (data || []).map((row) => ({
      ...templateCatalogService.normalizeTemplate(row),
      source: 'supabase'
    }));
  }
}

module.exports = new RAGServiceV2();
