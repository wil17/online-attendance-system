const db = require('../config/database');
const moment = require('moment');

class AttendanceController {
  // Check in
  async checkIn(req, res) {
    try {
      const userId = req.user.userId;
      const { 
        latitude, 
        longitude, 
        location, 
        method = 'manual',
        notes 
      } = req.body;

      // Get employee info
      const [employees] = await db.execute(
        'SELECT id, employee_id FROM employees WHERE user_id = ?',
        [userId]
      );

      if (employees.length === 0) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const employee = employees[0];
      const today = moment().format('YYYY-MM-DD');
      const now = moment().format('YYYY-MM-DD HH:mm:ss');

      // Check if already checked in today
      const [existingAttendance] = await db.execute(
        'SELECT id FROM attendance WHERE employee_id = ? AND DATE(check_in_time) = ?',
        [employee.id, today]
      );

      if (existingAttendance.length > 0) {
        return res.status(400).json({ message: 'Already checked in today' });
      }

      // Determine status (simple logic for now)
      const workStartHour = 8; // 8 AM
      const currentHour = moment().hour();
      let status = 'present';
      
      if (currentHour > workStartHour) {
        status = 'late';
      }

      // Insert attendance record
      const [result] = await db.execute(`
        INSERT INTO attendance (
          employee_id, check_in_time, check_in_location, 
          check_in_latitude, check_in_longitude, check_in_method, 
          status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        employee.id, now, location, 
        latitude, longitude, method, 
        status, notes
      ]);

      res.json({
        message: 'Check in successful',
        attendanceId: result.insertId,
        status,
        checkInTime: now
      });
    } catch (error) {
      console.error('Check in error:', error);
      res.status(500).json({ message: 'Server error during check in' });
    }
  }

  // Check out
  async checkOut(req, res) {
    try {
      const userId = req.user.userId;
      const { 
        latitude, 
        longitude, 
        location, 
        method = 'manual',
        notes 
      } = req.body;

      // Get employee info
      const [employees] = await db.execute(
        'SELECT id FROM employees WHERE user_id = ?',
        [userId]
      );

      if (employees.length === 0) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const employee = employees[0];
      const today = moment().format('YYYY-MM-DD');
      const now = moment().format('YYYY-MM-DD HH:mm:ss');

      // Find today's attendance record
      const [attendance] = await db.execute(`
        SELECT id, check_in_time FROM attendance 
        WHERE employee_id = ? AND DATE(check_in_time) = ? AND check_out_time IS NULL
      `, [employee.id, today]);

      if (attendance.length === 0) {
        return res.status(400).json({ message: 'No check in record found for today' });
      }

      const attendanceRecord = attendance[0];
      
      // Calculate work hours
      const checkInTime = moment(attendanceRecord.check_in_time);
      const checkOutTime = moment(now);
      const workHours = checkOutTime.diff(checkInTime, 'hours', true);
      
      // Calculate overtime (assuming 8 hours is standard)
      const overtimeHours = Math.max(0, workHours - 8);

      // Update attendance record
      await db.execute(`
        UPDATE attendance SET 
          check_out_time = ?, check_out_location = ?, 
          check_out_latitude = ?, check_out_longitude = ?, 
          check_out_method = ?, work_hours = ?, overtime_hours = ?,
          notes = CONCAT(COALESCE(notes, ''), CASE WHEN notes IS NOT NULL THEN ' | ' ELSE '' END, ?),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        now, location, 
        latitude, longitude, method, 
        workHours.toFixed(2), overtimeHours.toFixed(2), notes || '',
        attendanceRecord.id
      ]);

      res.json({
        message: 'Check out successful',
        checkOutTime: now,
        workHours: workHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2)
      });
    } catch (error) {
      console.error('Check out error:', error);
      res.status(500).json({ message: 'Server error during check out' });
    }
  }

  // Get attendance history
  async getAttendanceHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { startDate, endDate, limit = 50, offset = 0 } = req.query;

      // Get employee info
      const [employees] = await db.execute(
        'SELECT id FROM employees WHERE user_id = ?',
        [userId]
      );

      if (employees.length === 0) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const employee = employees[0];
      let query = `
        SELECT id, check_in_time, check_out_time, check_in_location, check_out_location,
               work_hours, overtime_hours, status, notes, created_at
        FROM attendance 
        WHERE employee_id = ?
      `;
      let params = [employee.id];

      if (startDate && endDate) {
        query += ' AND DATE(check_in_time) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      query += ' ORDER BY check_in_time DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [attendanceRecords] = await db.execute(query, params);

      res.json({
        attendance: attendanceRecords,
        total: attendanceRecords.length
      });
    } catch (error) {
      console.error('Get attendance history error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get today's attendance status
  async getTodayAttendance(req, res) {
    try {
      const userId = req.user.userId;

      // Get employee info
      const [employees] = await db.execute(
        'SELECT id FROM employees WHERE user_id = ?',
        [userId]
      );

      if (employees.length === 0) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const employee = employees[0];
      const today = moment().format('YYYY-MM-DD');

      const [attendance] = await db.execute(`
        SELECT id, check_in_time, check_out_time, check_in_location, 
               work_hours, overtime_hours, status
        FROM attendance 
        WHERE employee_id = ? AND DATE(check_in_time) = ?
      `, [employee.id, today]);

      if (attendance.length === 0) {
        return res.json({
          isCheckedIn: false,
          attendance: null
        });
      }

      const record = attendance[0];
      res.json({
        isCheckedIn: true,
        isCheckedOut: record.check_out_time !== null,
        attendance: record
      });
    } catch (error) {
      console.error('Get today attendance error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get attendance statistics
  async getAttendanceStats(req, res) {
    try {
      const userId = req.user.userId;
      const { month = moment().month() + 1, year = moment().year() } = req.query;

      // Get employee info
      const [employees] = await db.execute(
        'SELECT id FROM employees WHERE user_id = ?',
        [userId]
      );

      if (employees.length === 0) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const employee = employees[0];

      // Get monthly statistics
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total_days,
          COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
          COALESCE(ROUND(AVG(work_hours), 2), 0) as avg_work_hours,
          COALESCE(ROUND(SUM(work_hours), 2), 0) as total_work_hours,
          COALESCE(ROUND(SUM(overtime_hours), 2), 0) as total_overtime_hours
        FROM attendance 
        WHERE employee_id = ? AND MONTH(check_in_time) = ? AND YEAR(check_in_time) = ?
      `, [employee.id, month, year]);

      res.json({ stats: stats[0] });
    } catch (error) {
      console.error('Get attendance stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new AttendanceController();