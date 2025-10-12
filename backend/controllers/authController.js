const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { validationResult } = require('express-validator');

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, role = 'employee' } = req.body;

      // Check if user already exists
      const [existingUser] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Insert user
      const [result] = await db.execute(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, role]
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.insertId, email, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: result.insertId,
          email,
          role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user with employee data
      const [users] = await db.execute(`
        SELECT u.*, e.first_name, e.last_name, e.employee_id, e.department, e.position
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE u.email = ? AND u.is_active = TRUE
      `, [email]);

      if (users.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const user = users[0];

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          employeeId: user.employee_id 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employee_id,
          firstName: user.first_name,
          lastName: user.last_name,
          department: user.department,
          position: user.position
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      const [users] = await db.execute(`
        SELECT u.id, u.email, u.role, u.created_at,
               e.employee_id, e.first_name, e.last_name, e.phone, 
               e.department, e.position, e.hire_date, e.face_image
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE u.id = ?
      `, [userId]);

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = users[0];
      delete user.password; // Remove password from response

      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { firstName, lastName, phone } = req.body;

      await db.execute(`
        UPDATE employees SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [firstName, lastName, phone, userId]);

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      // Get current password
      const [users] = await db.execute(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await db.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedNewPassword, userId]
      );

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new AuthController();