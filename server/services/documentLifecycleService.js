const supabase = require('../utils/supabaseClient');

const memoryStore = new Map();

class DocumentLifecycleService {
  isMissingTableError(error) {
    const message = String(error?.message || '').toLowerCase();
    const code = String(error?.code || '');
    return code === '42P01' || message.includes('could not find the table') || message.includes('relation') && message.includes('does not exist');
  }

  useMemoryFallback(record) {
    const id = `local-${Date.now()}-${Math.round(Math.random() * 10000)}`;
    const row = { id, ...record, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    memoryStore.set(id, row);
    return row;
  }

  async createDocument(payload) {
    const baseRecord = {
      created_by: payload.created_by,
      original_file: payload.original_file || null,
      status: payload.status || 'uploaded',
      document_type: payload.document_type || null,
      extracted_json: payload.extracted_json || {},
      template_name: payload.template_name || null,
      template_id: payload.template_id || null,
      verification_report: payload.verification_report || null,
      version: payload.version || 1,
      department: payload.department || null,
      artifacts: payload.artifacts || {},
      summary: payload.summary || null,
      review_comments: payload.review_comments || null,
      approved_by: payload.approved_by || null
    };

    if (!supabase) {
      return this.useMemoryFallback(baseRecord);
    }

    const { data, error } = await supabase.from('documents').insert([baseRecord]).select().single();
    if (error) {
      if (this.isMissingTableError(error)) {
        return this.useMemoryFallback(baseRecord);
      }
      throw error;
    }
    return data;
  }

  async updateDocument(id, updates) {
    if (!supabase) {
      const existing = memoryStore.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
      memoryStore.set(id, updated);
      return updated;
    }

    const { data, error } = await supabase
      .from('documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (this.isMissingTableError(error)) {
        const existing = memoryStore.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
        memoryStore.set(id, updated);
        return updated;
      }
      throw error;
    }
    return data;
  }

  async getDocument(id) {
    if (!supabase) {
      return memoryStore.get(id) || null;
    }
    const { data, error } = await supabase.from('documents').select('*').eq('id', id).single();
    if (error) {
      if (this.isMissingTableError(error)) {
        return memoryStore.get(id) || null;
      }
      throw error;
    }
    return data;
  }

  async listPending() {
    if (!supabase) {
      return Array.from(memoryStore.values()).filter((doc) => doc.status === 'pending_admin');
    }
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('status', 'pending_admin')
      .order('created_at', { ascending: false });
    if (error) {
      if (this.isMissingTableError(error)) {
        return Array.from(memoryStore.values()).filter((doc) => doc.status === 'pending_admin');
      }
      throw error;
    }
    return data || [];
  }
}

module.exports = new DocumentLifecycleService();
