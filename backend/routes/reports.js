const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Temporary routes - akan dikembangkan nanti
router.get('/attendance', auth, (req, res) => {
  res.json({ message: 'Attendance reports - coming soon' });
});

router.get('/attendance/export', auth, (req, res) => {
  res.json({ message: 'Export attendance - coming soon' });
});

module.exports = router;