/**
 * Format currency amount
 * @param {Number} amount - Amount to format
 * @param {String} currency - Currency code (default: AUD)
 * @returns {String} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'AUD') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date to local string
 * @param {String|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {String} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  const d = new Date(date);
  const defaultOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleDateString('en-AU', { ...defaultOptions, ...options });
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {String} ISO date string
 */
export const formatDateISO = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

/**
 * Get date range for a period
 * @param {String} period - 'week', 'month', 'year'
 * @param {Date} referenceDate - Reference date (default: now)
 * @returns {Object} { startDate, endDate }
 */
export const getDateRange = (period, referenceDate = new Date()) => {
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
    startDate: formatDateISO(startDate),
    endDate: formatDateISO(endDate),
  };
};

/**
 * Calculate percentage change
 * @param {Number} current - Current value
 * @param {Number} previous - Previous value
 * @returns {Number} Percentage change
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Truncate string with ellipsis
 * @param {String} str - String to truncate
 * @param {Number} maxLength - Maximum length
 * @returns {String} Truncated string
 */
export const truncateString = (str, maxLength = 50) => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} Is valid
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} { isValid, errors }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calculate progress percentage
 * @param {Number} current - Current value
 * @param {Number} target - Target value
 * @returns {Number} Percentage (0-100)
 */
export const calculateProgress = (current, target) => {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.max(0, (current / target) * 100));
};

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {String} key - Key to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    result[group] = result[group] || [];
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Sort array by date
 * @param {Array} array - Array to sort
 * @param {String} key - Date key
 * @param {String} order - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
export const sortByDate = (array, key = 'date', order = 'desc') => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[key]);
    const dateB = new Date(b[key]);
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

/**
 * Generate monthly labels for charts
 * @param {Number} year - Year
 * @returns {Array} Array of month labels
 */
export const generateMonthLabels = (year = new Date().getFullYear()) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((m) => `${m} ${year}`);
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {Number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
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
 * Export data to CSV
 * @param {Array} data - Array of objects
 * @param {String} filename - Filename for download
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape values containing commas or quotes
          const stringValue = String(value ?? '');
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Get color for category
 * @param {String} category - Category name
 * @returns {String} Hex color code
 */
export const getCategoryColor = (category) => {
  const colors = {
    'Housing': '#EF4444',
    'Food': '#F59E0B',
    'Transportation': '#3B82F6',
    'Utilities': '#6366F1',
    'Healthcare': '#EC4899',
    'Entertainment': '#8B5CF6',
    'Shopping': '#10B981',
    'Education': '#14B8A6',
    'Debt Payments': '#DC2626',
    'Savings': '#059669',
    'Other': '#6B7280',
  };
  return colors[category] || '#6B7280';
};
