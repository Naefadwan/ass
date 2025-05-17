/**
 * Rate limiting middleware for AI Assistant routes
 * Prevents abuse by limiting the number of requests per user/IP
 */

// In-memory store for rate limiting
// For production, consider using Redis or another persistent store
const requestStore = new Map();

/**
 * Simple rate limiter that tracks requests by IP or user ID
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.keyPrefix - Prefix for rate limit keys
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute
    maxRequests = 5,      // 5 requests per minute
    keyPrefix = 'rl',     // Default key prefix
    message = 'Too many requests, please try again later.'
  } = options;

  return (req, res, next) => {
    // Get identifier - prefer user ID if logged in, fall back to IP
    const identifier = req.user ? `user_${req.user.id}` : `ip_${req.ip}`;
    const key = `${keyPrefix}:${identifier}`;
    
    // Get current time
    const now = Date.now();
    
    // Initialize or get existing record
    if (!requestStore.has(key)) {
      requestStore.set(key, {
        count: 0,
        resetAt: now + windowMs
      });
    }
    
    const record = requestStore.get(key);
    
    // Reset counter if window has passed
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }
    
    // Check if limit exceeded
    if (record.count >= maxRequests) {
      // Log the rate limit hit
      console.log(`[Rate Limit] ${identifier} hit rate limit`);
      
      // Set retry-after header (in seconds)
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.set('Retry-After', retryAfterSeconds.toString());
      
      return res.status(429).json({
        success: false, 
        error: message,
        retryAfter: retryAfterSeconds
      });
    }
    
    // Increment count and save
    record.count += 1;
    requestStore.set(key, record);
    
    // Clean up old records periodically
    if (Math.random() < 0.01) { // ~1% chance to run cleanup on each request
      const keys = Array.from(requestStore.keys());
      keys.forEach(storeKey => {
        const r = requestStore.get(storeKey);
        if (now > r.resetAt + (windowMs * 2)) {
          requestStore.delete(storeKey);
        }
      });
    }
    
    next();
  };
};

// Rate limiter for AI Assistant chat - more permissive
const aiAssistantLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 10,          // 10 requests per minute
  keyPrefix: 'ai-assistant',
  message: 'You are sending too many messages to the AI assistant. Please wait a moment before trying again.'
});

// Stricter rate limiter for development/debug endpoints
const debugEndpointLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 5,           // 5 requests per minute
  keyPrefix: 'debug-endpoint',
  message: 'You are making too many requests to the debug endpoint. Please wait a moment before trying again.'
});

module.exports = {
  createRateLimiter,
  aiAssistantLimiter,
  debugEndpointLimiter
};
