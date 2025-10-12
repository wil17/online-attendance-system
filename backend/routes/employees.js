const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware untuk validasi role
const requireAdminOrHR = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'hr')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or HR role required.'
    });
  }
  next();
};

// GET /api/employees - Get all employees (with optional filters)
router.get('/', auth, requireAdminOrHR, employeeController.getEmployees);

// GET /api/employees/simple - Alternative simple endpoint tanpa pagination
router.get('/simple', auth, requireAdminOrHR, employeeController.getEmployeesSimple);

// GET /api/employees/raw - Alternative dengan raw query untuk testing
router.get('/raw', auth, requireAdminOrHR, employeeController.getEmployeesRaw);

// GET /api/employees/:id - Get single employee
router.get('/:id', auth, requireAdminOrHR, employeeController.getEmployee);

// POST /api/employees - Create new employee
router.post('/', 
  auth, 
  requireAdminOrHR,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('position').notEmpty().withMessage('Position is required'),
    body('role').isIn(['employee', 'manager', 'hr', 'admin']).withMessage('Invalid role')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    next();
  },
  employeeController.createEmployee
);

// PUT /api/employees/:id - Update employee
router.put('/:id', 
  auth, 
  requireAdminOrHR,
  [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('department').optional().notEmpty().withMessage('Department cannot be empty'),
    body('position').optional().notEmpty().withMessage('Position cannot be empty'),
    body('role').optional().isIn(['employee', 'manager', 'hr', 'admin']).withMessage('Invalid role'),
    body('status').optional().isIn(['active', 'inactive', 'terminated']).withMessage('Invalid status')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    next();
  },
  employeeController.updateEmployee
);

// DELETE /api/employees/:id - Delete (terminate) employee
router.delete('/:id', auth, requireAdminOrHR, employeeController.deleteEmployee);

module.exports = router;