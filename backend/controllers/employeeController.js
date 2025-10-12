const db = require('../config/database');
const bcrypt = require('bcryptjs');

class EmployeeController {
  async getEmployees(req, res) {
    try {
      const { department, status = 'active' } = req.query;

      // Gunakan query sederhana tanpa LIMIT/OFFSET dulu
      let query = `
        SELECT e.id, e.employee_id, e.first_name, e.last_name, e.phone,
               e.department, e.position, e.hire_date, e.status, e.salary,
               u.email, u.role
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE 1=1
      `;
      let params = [];

      // Add status filter if provided
      if (status) {
        query += ' AND e.status = ?';
        params.push(status);
      }

      // Add department filter if provided
      if (department && department !== 'All Departments' && department !== '') {
        query += ' AND e.department = ?';
        params.push(department);
      }

      query += ' ORDER BY e.first_name ASC';

      console.log('Query:', query);
      console.log('Params:', params);

      const [employees] = await db.execute(query, params);

      res.json({
        success: true,
        employees,
        total: employees.length,
        currentPage: 1,
        totalPages: 1
      });
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while fetching employees',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async getEmployee(req, res) {
    try {
      const { id } = req.params;

      // Validate ID
      const employeeId = parseInt(id);
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid employee ID'
        });
      }

      const [employees] = await db.execute(
        `SELECT e.id, e.employee_id, e.first_name, e.last_name, e.phone,
                e.department, e.position, e.hire_date, e.status, e.salary, 
                e.address, e.emergency_contact, e.birth_date, e.gender, e.created_at,
                u.email, u.role, u.is_active
         FROM employees e
         LEFT JOIN users u ON e.user_id = u.id
         WHERE e.id = ?`,
        [employeeId]
      );

      if (employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.json({
        success: true,
        employee: employees[0]
      });
    } catch (error) {
      console.error('Get employee error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching employee',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async createEmployee(req, res) {
    try {
      const {
        email, password, role = 'employee',
        employeeId, firstName, lastName, phone,
        department, position, hireDate, salary,
        address, emergencyContact, birthDate, gender
      } = req.body;

      // Validate required fields
      if (!email || !password || !employeeId || !firstName || !lastName || !department || !position) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: email, password, employeeId, firstName, lastName, department, position'
        });
      }

      // Check if email already exists
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Check if employee ID already exists
      const [existingEmployees] = await db.execute(
        'SELECT id FROM employees WHERE employee_id = ?',
        [employeeId]
      );

      if (existingEmployees.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }

      // Start transaction
      await db.execute('START TRANSACTION');

      try {
        // Create user account first
        const hashedPassword = await bcrypt.hash(password, 12);
        const [userResult] = await db.execute(
          'INSERT INTO users (email, password, role, is_active, email_verified) VALUES (?, ?, ?, TRUE, TRUE)',
          [email, hashedPassword, role]
        );

        // Create employee profile
        const [employeeResult] = await db.execute(
          `INSERT INTO employees (user_id, employee_id, first_name, last_name, phone, 
           department, position, hire_date, salary, status, address, emergency_contact, 
           birth_date, gender) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
          [userResult.insertId, employeeId, firstName, lastName, phone, 
           department, position, hireDate || new Date(), salary || 0,
           address || '', emergencyContact || '', birthDate || null, gender || 'male']
        );

        await db.execute('COMMIT');

        // Get the created employee with join
        const [newEmployee] = await db.execute(
          `SELECT e.id, e.employee_id, e.first_name, e.last_name, e.phone,
                  e.department, e.position, e.hire_date, e.status, e.salary,
                  u.email, u.role
           FROM employees e
           LEFT JOIN users u ON e.user_id = u.id
           WHERE e.id = ?`,
          [employeeResult.insertId]
        );

        res.status(201).json({
          success: true,
          message: 'Employee created successfully',
          employee: newEmployee[0]
        });
      } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Create employee error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while creating employee',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const {
        firstName, lastName, phone, department, 
        position, salary, status, email, role,
        address, emergencyContact, birthDate, gender
      } = req.body;

      // Validate ID
      const employeeId = parseInt(id);
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid employee ID'
        });
      }

      // Check if employee exists
      const [employees] = await db.execute(
        'SELECT user_id FROM employees WHERE id = ?',
        [employeeId]
      );

      if (employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      const userId = employees[0].user_id;

      await db.execute('START TRANSACTION');

      try {
        // Update employee table
        await db.execute(
          `UPDATE employees SET 
           first_name = ?, last_name = ?, phone = ?, 
           department = ?, position = ?, salary = ?, 
           address = ?, emergency_contact = ?, birth_date = ?, gender = ?,
           ${status ? 'status = ?,' : ''} 
           updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            firstName, lastName, phone, department, position, 
            salary || 0, address || '', emergencyContact || '', 
            birthDate || null, gender || 'male',
            ...(status ? [status] : []),
            employeeId
          ].filter(param => param !== undefined)
        );

        // Update user table if email or role is provided
        if (email || role) {
          let userUpdateQuery = 'UPDATE users SET ';
          let userParams = [];
          
          if (email) {
            userUpdateQuery += 'email = ?, ';
            userParams.push(email);
          }
          if (role) {
            userUpdateQuery += 'role = ?, ';
            userParams.push(role);
          }
          
          userUpdateQuery += 'updated_at = CURRENT_TIMESTAMP WHERE id = ?';
          userParams.push(userId);
          
          await db.execute(userUpdateQuery, userParams);
        }

        await db.execute('COMMIT');

        // Get updated employee data
        const [updatedEmployee] = await db.execute(
          `SELECT e.id, e.employee_id, e.first_name, e.last_name, e.phone,
                  e.department, e.position, e.hire_date, e.status, e.salary,
                  u.email, u.role
           FROM employees e
           LEFT JOIN users u ON e.user_id = u.id
           WHERE e.id = ?`,
          [employeeId]
        );

        res.json({
          success: true,
          message: 'Employee updated successfully',
          employee: updatedEmployee[0]
        });
      } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Update employee error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while updating employee',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async deleteEmployee(req, res) {
    try {
      const { id } = req.params;

      // Validate ID
      const employeeId = parseInt(id);
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid employee ID'
        });
      }

      // Check if employee exists
      const [employees] = await db.execute(
        'SELECT id FROM employees WHERE id = ?',
        [employeeId]
      );

      if (employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Set status to terminated instead of deleting
      await db.execute(
        'UPDATE employees SET status = "terminated", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [employeeId]
      );

      res.json({
        success: true,
        message: 'Employee terminated successfully'
      });
    } catch (error) {
      console.error('Delete employee error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while terminating employee',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Method alternatif dengan raw query untuk testing
  async getEmployeesRaw(req, res) {
    try {
      const { department, status = 'active' } = req.query;

      // Build query string secara manual untuk menghindari masalah parameter
      let query = `
        SELECT e.id, e.employee_id, e.first_name, e.last_name, e.phone,
               e.department, e.position, e.hire_date, e.status, e.salary,
               u.email, u.role
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.status = '${status}'
      `;

      if (department && department !== 'All Departments' && department !== '') {
        query += ` AND e.department = '${department}'`;
      }

      query += ' ORDER BY e.first_name ASC';

      console.log('Raw Query:', query);

      const [employees] = await db.query(query);

      res.json({
        success: true,
        employees,
        total: employees.length
      });
    } catch (error) {
      console.error('Get employees raw error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while fetching employees',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Alternative simple method without pagination for testing
  async getEmployeesSimple(req, res) {
    try {
      const { department, status = 'active' } = req.query;

      let query = `
        SELECT e.id, e.employee_id, e.first_name, e.last_name, e.phone,
               e.department, e.position, e.hire_date, e.status, e.salary,
               u.email, u.role
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE 1=1
      `;
      let params = [];

      if (status) {
        query += ' AND e.status = ?';
        params.push(status);
      }

      if (department && department !== 'All Departments') {
        query += ' AND e.department = ?';
        params.push(department);
      }

      query += ' ORDER BY e.first_name ASC';

      console.log('Simple Query:', query);
      console.log('Simple Params:', params);

      const [employees] = await db.execute(query, params);

      res.json({
        success: true,
        employees,
        total: employees.length
      });
    } catch (error) {
      console.error('Get employees simple error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while fetching employees',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new EmployeeController();