const express = require('express');
const lifecycleService = require('../services/documentLifecycleServiceV2');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const summary = await lifecycleService.getDashboardSummary({
      role: req.user.role,
      userId: req.user.id
    });

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
