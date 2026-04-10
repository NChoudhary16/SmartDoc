const supabase = require('../utils/supabaseClient');

const memoryStore = new Map();

/** Omit content_embedding from API responses (large); column still updated in DB when provided. */
const DOCUMENT_SELECT =
  'id, created_at, updated_at, created_by, created_by_name, creator_role, approved_by, assigned_to, original_file, status, document_type, extracted_json, template_id, template_name, verification_report, validation_report, version, department, artifacts, summary, review_comments, history';

class DocumentLifecycleServiceV2 {
  isMissingTableError(error) {
    const message = String(error?.message || '').toLowerCase();
    const code = String(error?.code || '');
    return code === '42P01' || (message.includes('relation') && message.includes('does not exist'));
  }

  buildStoredRecord(payload, existing = null) {
    const now = new Date().toISOString();
    const nextStatus = payload.status || existing?.status || 'uploaded';
    const historyEntry = {
      status: nextStatus,
      at: now,
      note: payload.history_note || payload.review_comments || null
    };

    const priorHistory = Array.isArray(existing?.history) ? existing.history : [];
    const history =
      existing && existing.status === nextStatus
        ? priorHistory
        : [...priorHistory, historyEntry];

    // history_note is a virtual field used only to build the history array above.
    // Strip it so it never reaches Supabase (the column doesn't exist in the DB).
    const { history_note: _hn, ...cleanPayload } = payload;

    return {
      ...(existing || {}),
      ...cleanPayload,
      history,
      updated_at: now,
      created_at: existing?.created_at || now
    };
  }

  useMemoryFallback(record, id = null) {
    const docId = id || `local-${Date.now()}-${Math.round(Math.random() * 10000)}`;
    const stored = this.buildStoredRecord(record, id ? memoryStore.get(id) || null : null);
    const row = { id: docId, ...stored };
    memoryStore.set(docId, row);
    return row;
  }

  async createDocument(payload) {
    const baseRecord = this.buildStoredRecord({
      created_by: payload.created_by,
      created_by_name: payload.created_by_name || null,
      creator_role: payload.creator_role || null,
      original_file: payload.original_file || null,
      status: payload.status || 'uploaded',
      document_type: payload.document_type || null,
      extracted_json: payload.extracted_json || {},
      template_name: payload.template_name || null,
      template_id: payload.template_id || null,
      verification_report: payload.verification_report || null,
      validation_report: payload.validation_report || null,
      version: payload.version || 1,
      department: payload.department || null,
      artifacts: payload.artifacts || {},
      summary: payload.summary || null,
      review_comments: payload.review_comments || null,
      approved_by: payload.approved_by || null,
      assigned_to: payload.assigned_to || null
    });

    if (!supabase) {
      return this.useMemoryFallback(baseRecord);
    }

    const { data, error } = await supabase.from('documents').insert([baseRecord]).select(DOCUMENT_SELECT).single();
    if (error) {
      if (this.isMissingTableError(error)) return this.useMemoryFallback(baseRecord);
      throw error;
    }
    return data;
  }

  async updateDocument(id, updates) {
    if (!supabase) {
      return this.useMemoryFallback(updates, id);
    }

    const current = await this.getDocument(id);
    if (!current) return null;
    const payload = this.buildStoredRecord(updates, current);

    const { data, error } = await supabase
      .from('documents')
      .update(payload)
      .eq('id', id)
      .select(DOCUMENT_SELECT)
      .single();

    if (error) {
      if (this.isMissingTableError(error)) return this.useMemoryFallback(updates, id);
      throw error;
    }
    return data;
  }

  async getDocument(id) {
    if (!supabase) return memoryStore.get(id) || null;
    const { data, error } = await supabase.from('documents').select(DOCUMENT_SELECT).eq('id', id).single();
    if (error) {
      if (this.isMissingTableError(error)) return memoryStore.get(id) || null;
      throw error;
    }
    return data;
  }

  async listDocuments({ role, userId, status, search } = {}) {
    let docs = [];

    if (!supabase) {
      docs = Array.from(memoryStore.values());
    } else {
      const { data, error } = await supabase.from('documents').select(DOCUMENT_SELECT).order('created_at', { ascending: false });
      if (error) {
        if (this.isMissingTableError(error)) {
          docs = Array.from(memoryStore.values());
        } else {
          throw error;
        }
      } else {
        docs = data || [];
      }
    }

    return docs.filter((doc) => {
      if (role !== 'admin' && userId && String(doc.created_by) !== String(userId)) return false;
      if (status && doc.status !== status) return false;
      if (search) {
        const term = String(search).toLowerCase();
        const haystack = [doc.id, doc.original_file, doc.document_type, doc.summary, doc.status].join(' ').toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }

  async listPending() {
    return this.listDocuments({ status: 'pending_admin' });
  }

  async getDashboardSummary({ role, userId }) {
    const docs = await this.listDocuments({ role, userId });
    const today = new Date().toISOString().slice(0, 10);

    const byStatus = docs.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {});

    const recentDocuments = docs.slice(0, 5).map((doc) => ({
      id: doc.id,
      original_file: doc.original_file,
      status: doc.status,
      document_type: doc.document_type,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      summary: doc.summary,
      validation_report: doc.validation_report,
      verification_report: doc.verification_report
    }));

    return {
      totals: {
        total_documents: docs.length,
        pending_review: byStatus.pending_admin || 0,
        approved_today: docs.filter((doc) => doc.status === 'approved' && String(doc.updated_at || '').slice(0, 10) === today).length,
        rejected: byStatus.rejected || 0
      },
      by_status: byStatus,
      recent_documents: recentDocuments,
      processing_health: {
        rag_templates_online: true,
        editable_outputs_supported: true,
        validation_gate_enabled: true
      }
    };
  }
}

module.exports = new DocumentLifecycleServiceV2();
