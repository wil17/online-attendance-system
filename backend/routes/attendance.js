const express = require('express');
const { body } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const checkInValidation = [
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('method').optional().isIn(['manual', 'qr', 'face', 'location'])
];

// Routes
router.post('/check-in', auth, checkInValidation, attendanceController.checkIn);
router.post('/check-out', auth, checkInValidation, attendanceController.checkOut);
router.get('/history', auth, attendanceController.getAttendanceHistory);
router.get('/today', auth, attendanceController.getTodayAttendance);
router.get('/stats', auth, attendanceController.getAttendanceStats);

module.exports = router;