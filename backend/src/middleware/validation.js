const { body, param, query: queryValidator, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validations
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  body('consentGiven')
    .isBoolean()
    .equals('true')
    .withMessage('You must consent to the privacy policy to register'),
  handleValidationErrors,
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// Income validations
const incomeValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('source')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Source must not exceed 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('recurring')
    .optional()
    .isBoolean()
    .withMessage('Recurring must be a boolean'),
  handleValidationErrors,
];

// Expense validations
const expenseValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('category')
    .notEmpty()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category is required and must not exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('recurring')
    .optional()
    .isBoolean()
    .withMessage('Recurring must be a boolean'),
  body('recurringFrequency')
    .optional()
    .isIn(['weekly', 'fortnightly', 'monthly'])
    .withMessage('Recurring frequency must be weekly, fortnightly, or monthly'),
  handleValidationErrors,
];

// Goal validations
const goalValidation = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Goal name is required and must not exceed 255 characters'),
  body('type')
    .isIn(['savings', 'debt'])
    .withMessage('Goal type must be either savings or debt'),
  body('targetAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be a positive number'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current amount must be a non-negative number'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid deadline date'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  handleValidationErrors,
];

// Budget validations
const budgetValidation = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Budget name is required and must not exceed 255 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('period')
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Period must be weekly, monthly, or yearly'),
  body('categoryId')
    .optional({ nullable: true })
    .isInt()
    .withMessage('Invalid category ID'),
  body('startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  body('alertThreshold')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Alert threshold must be between 1 and 100'),
  handleValidationErrors,
];

// Category validations
const categoryValidation = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name is required and must not exceed 100 characters'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Category type must be either income or expense'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters'),
  handleValidationErrors,
];

// Query validations
const dateRangeValidation = [
  queryValidator('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  queryValidator('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  handleValidationErrors,
];

// UUID param validation
const uuidParamValidation = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  incomeValidation,
  expenseValidation,
  goalValidation,
  budgetValidation,
  categoryValidation,
  dateRangeValidation,
  uuidParamValidation,
  handleValidationErrors,
};
