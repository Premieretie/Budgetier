/**
 * Format currency amount
 * @param {Number} amount - Amount to format
 * @param {String} currency - Currency code (default: AUD)
 * @returns {String} Formatted currency string
 */
const formatCurrency = (amount, currency = 'AUD') => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format date to local string
 * @param {String|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {String} Formatted date string
 */
const formatDate = (date, options = {}) => {
  const d = new Date(date);
  const defaultOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleDateString('en-AU', { ...defaultOptions, ...options });
};

/**
 * Get date range for a period
 * @param {String} period - 'week', 'month', 'year'
 * @param {Date} referenceDate - Reference date (default: now)
 * @returns {Object} { startDate, endDate }
 */
const getDateRange = (period, referenceDate = new Date()) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let startDate, endDate;

  switch (period) {
    case 'week':
      const dayOfWeek = referenceDate.getDay();
      startDate = new Date(year, month, day - dayOfWeek);
      endDate = new Date(year, month, day + (6 - dayOfWeek));
      break;
    case 'month':
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
      break;
    case 'year':
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      break;
    default:
      throw new Error('Invalid period. Use week, month, or year.');
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

/**
 * Calculate percentage change
 * @param {Number} current - Current value
 * @param {Number} previous - Previous value
 * @returns {Number} Percentage change
 */
const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Truncate string with ellipsis
 * @param {String} str - String to truncate
 * @param {Number} maxLength - Maximum length
 * @returns {String} Truncated string
 */
const truncateString = (str, maxLength = 50) => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Generate unique ID
 * @returns {String} UUID v4
 */
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} Is valid
 */
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Sanitize string for safe display
 * @param {String} str - String to sanitize
 * @returns {String} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {Number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {String} key - Key to group by
 * @returns {Object} Grouped object
 */
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    result[group] = result[group] || [];
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Calculate days between dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {Number} Days difference
 */
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
};

/**
 * Check if date is today
 * @param {Date} date - Date to check
 * @returns {Boolean} Is today
 */
const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

module.exports = {
  formatCurrency,
  formatDate,
  getDateRange,
  calculatePercentageChange,
  truncateString,
  generateId,
  isValidEmail,
  sanitizeString,
  deepClone,
  debounce,
  groupBy,
  daysBetween,
  isToday,
};
