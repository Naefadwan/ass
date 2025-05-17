/**
 * Security utilities for input sanitization and validation
 * Provides protection against XSS attacks and other injection vectors
 */

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const escapeHtml = require('escape-html');
const validator = require('validator');
const crypto = require('crypto');

// Create DOMPurify instance with a virtual DOM
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitizes input to prevent XSS attacks
 * @param {string} input - The user input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (input === null || input === undefined) {
    return '';
  }
  
  // Convert to string if not already
  const strInput = String(input);
  
  // Use DOMPurify to clean the input (removes all HTML tags and dangerous attributes)
  const purified = DOMPurify.sanitize(strInput, {
    ALLOWED_TAGS: [], // No tags allowed, strip them all
    ALLOWED_ATTR: [], // No attributes allowed
    FORBID_TAGS: ['style', 'script', 'iframe', 'form'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick']
  });
  
  // Additional escaping for extra safety
  return escapeHtml(purified);
};

/**
 * Sanitizes HTML content, preserving only safe tags and attributes
 * Use this for content that should contain some HTML (like rich text)
 * @param {string} html - The HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
const sanitizeHtml = (html) => {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'title'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target="_blank"', 'rel="noopener noreferrer"'],
    FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover']
  });
};

/**
 * Validates if input is safe alphanumeric string
 * @param {string} input - The input to validate
 * @returns {boolean} - True if safe, false otherwise
 */
const isAlphanumericSafe = (input) => {
  if (!input) return false;
  return validator.isAlphanumeric(String(input).replace(/[_\-\s]/g, ''));
};

/**
 * Validates if string is a safe username (alphanumeric with limited special chars)
 * @param {string} username - Username to validate
 * @returns {boolean} - True if safe, false otherwise
 */
const isUsernameSafe = (username) => {
  if (!username) return false;
  return /^[A-Za-z0-9_\-\.]{3,30}$/.test(String(username));
};

/**
 * Validates if a string is a safe filename
 * @param {string} filename - Filename to validate
 * @returns {boolean} - True if safe, false otherwise
 */
const isFilenameSafe = (filename) => {
  if (!filename) return false;
  return /^[A-Za-z0-9_\-\.]{1,255}$/.test(String(filename)) && 
         !String(filename).includes('..'); // Prevent path traversal
};

/**
 * Generate a random token
 * @param {number} byteLength - Length of the token in bytes
 * @returns {string} - Random hex token
 */
const generateToken = (byteLength = 32) => {
  return crypto.randomBytes(byteLength).toString('hex');
};

/**
 * Generate a secure hash for sensitive data
 * @param {string} data - Data to hash
 * @param {string} salt - Salt to use (optional)
 * @returns {Object} - Object containing hash and salt
 */
const generateHash = (data, salt = null) => {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, useSalt, 10000, 64, 'sha512').toString('hex');
  
  return {
    hash,
    salt: useSalt
  };
};

/**
 * Compare input with a hashed value
 * @param {string} input - Input to check
 * @param {string} hash - Hash to compare against
 * @param {string} salt - Salt used for hashing
 * @returns {boolean} - True if match, false otherwise
 */
const compareWithHash = (input, hash, salt) => {
  const inputHash = crypto.pbkdf2Sync(input, salt, 10000, 64, 'sha512').toString('hex');
  return inputHash === hash;
};

/**
 * Sanitize SQL input to prevent injection
 * @param {string} input - SQL input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeSqlInput = (input) => {
  if (!input) return '';
  
  // Basic SQL injection prevention
  return String(input)
    .replace(/'/g, "''") // Escape single quotes
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/\0/g, '\\0') // Escape null bytes
    .replace(/%/g, '\\%') // Escape percent signs
    .replace(/_/g, '\\_'); // Escape underscores
};

/**
 * Get headers for security
 * @returns {Object} - Security headers
 */
const getSecurityHeaders = () => {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none'; img-src 'self' data:; media-src 'self'; frame-src 'none'; font-src 'self'; connect-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
};

/**
 * Apply security headers to response
 * @param {Object} res - Express response object
 */
const applySecurityHeaders = (res) => {
  const headers = getSecurityHeaders();
  Object.keys(headers).forEach(header => {
    res.setHeader(header, headers[header]);
  });
};

module.exports = {
  sanitizeInput,
  sanitizeHtml,
  isAlphanumericSafe,
  isUsernameSafe,
  isFilenameSafe,
  generateToken,
  generateHash,
  compareWithHash,
  sanitizeSqlInput,
  getSecurityHeaders,
  applySecurityHeaders
};

