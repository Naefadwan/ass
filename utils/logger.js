/**
 * Structured logging utility for E-Pharmacy
 * Provides consistent logging across the application with support for:
 * - Multiple log levels
 * - JSON structured logging
 * - Request ID tracking
 * - Error stack traces
 * - Environment-specific formatting
 */

const winston = require('winston');
const { format, createLogger, transports } = winston;
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for development environment - more readable
const developmentFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.colorize(),
  format.printf(({ timestamp, level, message, requestId, ...metadata }) => {
    let metaStr = '';
    if (Object.keys(metadata).length > 0) {
      if (metadata.error && metadata.error.stack) {
        metaStr = `\n${metadata.error.stack}`;
        delete metadata.error.stack;
      }
      
      if (Object.keys(metadata).length > 0) {
        metaStr += `\n${JSON.stringify(metadata, null, 2)}`;
      }
    }
    
    const reqIdStr = requestId ? `[${requestId}] ` : '';
    return `${timestamp} [${level}] ${reqIdStr}${message}${metaStr}`;
  })
);

// Custom format for production environment - JSON structured
const productionFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

// Select format based on environment
const selectedFormat = process.env.NODE_ENV === 'production' 
  ? productionFormat 
  : developmentFormat;

// Create the logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: selectedFormat,
  defaultMeta: { service: 'e-pharmacy-server' },
  transports: [
    // Console logging
    new transports.Console(),
    
    // File logging - all levels
    new transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    
    // Error logging - separate file
    new transports.File({ 
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ],
  exitOnError: false // Do not exit on handled exceptions
});

/**
 * Safely stringifies objects for logging, handling circular references
 * @param {Object} obj - Object to stringify
 * @returns {string} - Safe string representation
 */
const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    
    // Handle Error objects specially
    if (value instanceof Error) {
      const error = {};
      Object.getOwnPropertyNames(value).forEach(key => {
        error[key] = value[key];
      });
      return error;
    }
    
    return value;
  });
};

/**
 * Sanitizes log data to remove sensitive information
 * @param {Object} data - Data to sanitize
 * @returns {Object} - Sanitized data
 */
const sanitizeLogData = (data) => {
  if (!data) return data;
  
  // Create a deep clone to avoid modifying the original
  const sanitized = JSON.parse(safeStringify(data));
  
  // List of sensitive fields to mask
  const sensitiveFields = [
    'password', 'token', 'secret', 'authorization', 'cookie', 
    'securityAnswer', 'creditCard', 'cvv', 'ssn', 'nationalId'
  ];
  
  // Function to recursively mask sensitive data
  const maskSensitiveData = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        maskSensitiveData(obj[key]);
      }
    });
  };
  
  maskSensitiveData(sanitized);
  return sanitized;
};

/**
 * Extracts useful data from error objects
 * @param {Error} error - Error object
 * @returns {Object} - Extracted error data
 */
const formatError = (error) => {
  if (!error) return null;
  
  // If it's already an object with message, just return it
  if (typeof error === 'object' && !error.stack && error.message) {
    return error;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      ...(error.errors ? { errors: error.errors } : {})
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return { message: error };
  }
  
  // Handle other types
  return { error: sanitizeLogData(error) };
};

// Wrapper methods with additional functionality
const loggerWrapper = {
  /**
   * Log at debug level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  debug: (message, meta = {}) => {
    logger.debug(message, sanitizeLogData(meta));
  },
  
  /**
   * Log at info level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info: (message, meta = {}) => {
    logger.info(message, sanitizeLogData(meta));
  },
  
  /**
   * Log at warn level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  warn: (message, meta = {}) => {
    logger.warn(message, sanitizeLogData(meta));
  },
  
  /**
   * Log at error level with enhanced error handling
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata, can include error
   */
  error: (message, meta = {}) => {
    const metaData = { ...sanitizeLogData(meta) };
    
    // Extract and format error if provided
    if (meta.error) {
      metaData.error = formatError(meta.error);
    }
    
    logger.error(message, metaData);
  },
  
  /**
   * Create a child logger with request-specific context
   * @param {string} requestId - Unique request identifier
   * @returns {Object} - Child logger with request context
   */
  createRequestLogger: (requestId) => {
    const childLogger = logger.child({ requestId });
    
    return {
      debug: (message, meta = {}) => childLogger.debug(message, sanitizeLogData(meta)),
      info: (message, meta = {}) => childLogger.info(message, sanitizeLogData(meta)),
      warn: (message, meta = {}) => childLogger.warn(message, sanitizeLogData(meta)),
      error: (message, meta = {}) => {
        const metaData = { ...sanitizeLogData(meta) };
        if (meta.error) {
          metaData.error = formatError(meta.error);
        }
        childLogger.error(message, metaData);
      }
    };
  },
  
  /**
   * Log HTTP request details
   * @param {Object} req - Express request object
   * @param {string} requestId - Request identifier
   */
  logRequest: (req, requestId) => {
    const meta = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    // Add user ID if authenticated
    if (req.user && req.user.id) {
      meta.userId = req.user.id;
    }
    
    logger.info(`HTTP ${req.method} ${req.originalUrl || req.url}`, meta);
  },
  
  /**
   * Log HTTP response details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} time - Response time in ms
   * @param {string} requestId - Request identifier
   */
  logResponse: (req, res, time, requestId) => {
    const meta = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime: `${time}ms`
    };
    
    // Use appropriate log level based on status code
    const level = res.statusCode >= 500 ? 'error' :
                 res.statusCode >= 400 ? 'warn' : 'info';
                 
    logger[level](`HTTP ${req.method} ${req.originalUrl || req.url} ${res.statusCode}`, meta);
  },
  
  /**
   * Create a middleware for request logging
   * @returns {Function} - Express middleware
   */
  requestLoggerMiddleware: () => {
    return (req, res, next) => {
      // Generate unique request ID if not already present
      const requestId = req.headers['x-request-id'] || 
                     `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Add request ID to response headers
      res.setHeader('x-request-id', requestId);
      
      // Add request logger to the request object
      req.logger = loggerWrapper.createRequestLogger(requestId);
      
      // Log request
      loggerWrapper.logRequest(req, requestId);
      
      // Record start time
      const start = Date.now();
      
      // Log response when finished
      res.on('finish', () => {
        const duration = Date.now() - start;
        loggerWrapper.logResponse(req, res, duration, requestId);
      });
      
      next();
    };
  }
};

module.exports = loggerWrapper;

