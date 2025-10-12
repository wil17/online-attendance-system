const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get leave requests (employee sees own, manager/hr sees all)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = `
      SELECT lr.*, e.first_name, e.last_name, e.employee_id
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
    `;
    
    let params = [];

    if (userRole === 'employee') {
      query += ' WHERE e.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY lr.created_at DESC';

    const [requests] = await db.execute(query, params);
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create leave request
router.post('/', auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const userId = req.user.userId;

    // Get employee ID
    const [employees] = await db.execute(
      'SELECT id FROM employees WHERE user_id = ?',
      [userId]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const employeeId = employees[0].id;

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    await db.execute(`
      INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [employeeId, leaveType, startDate, endDate, days, reason]);

    res.json({ success: true, message: 'Leave request submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject leave request
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approved' or 'rejected'
    const userId = req.user.userId;

    if (req.user.role !== 'manager' && req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await db.execute(`
      UPDATE leave_requests SET 
        status = ?, 
        approved_by = ?, 
        approved_at = CURRENT_TIMESTAMP,
        rejection_reason = ?
      WHERE id = ?
    `, [action, userId, rejectionReason || null, id]);

    res.json({ success: true, message: `Leave request ${action}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;