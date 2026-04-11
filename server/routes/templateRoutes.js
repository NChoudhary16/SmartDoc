const express = require('express');
const router = express.Router();
const ragService = require('../services/ragService');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * GET /api/templates — list template library (vector-backed when Supabase is configured).
 */
router.get('/', requireAuth, requireRole('startup', 'mentor', 'employee', 'admin'), async (req, res, next) => {
  try {
    const templates = await ragService.listTemplates();
    res.json({ success: true, templates });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/templates — register a template row + embedding (admin).
 * Body: { name, type?, description?, file_path }
 */
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, type, description, file_path } = req.body || {};
    if (!name || !file_path) {
      return res.status(400).json({ success: false, message: 'name and file_path are required' });
    }
    const template = await ragService.addTemplate({
      name,
      type: type || null,
      description: description || '',
      file_path,
    });
    res.status(201).json({ success: true, template });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
