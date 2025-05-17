const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validationResult } = require("express-validator");
const returnResponse = require("../utils/response");
const csrf = require('csurf');
const { aiAssistantLimiter, debugEndpointLimiter } = require('../middleware/rateLimiter');

// Use the same CSRF configuration as in server.js
const csrfProtection = csrf({
  cookie: {
    key: 'XSRF-TOKEN',
    httpOnly: false, // Needs to be accessible from JS
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], // Only check CSRF for state-changing methods
  value: (req) => {
    console.log('[CSRF Route] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[CSRF Route] Cookies:', req.cookies);
    
    let token = (
      (req.body && req.body._csrf) ||
      req.headers['x-csrf-token'] ||
      req.headers['x-xsrf-token'] ||
      req.headers['x-csrftoken'] ||
      req.headers['xsrf-token'] ||
      req.headers['x-xsrftoken'] ||
      (req.query && req.query._csrf)
    );
    
    console.log('[CSRF Route] Token from headers/body/query:', token);
    
    if (!token && req.cookies && req.cookies['XSRF-TOKEN']) {
      console.log('[CSRF Route] Found token in XSRF-TOKEN cookie');
      token = req.cookies['XSRF-TOKEN'];
    }
    
    return token;
  }
});

// CSRF Error Handler for AI routes
function csrfErrorHandler(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  // Log the error details
  console.error('[CSRF Error]', {
    url: req.url,
    method: req.method,
    headers: req.headers,
    cookies: req.cookies,
    error: err.message
  });
  
  // Return a clear error message
  return returnResponse(res, 403, false, null, 'Invalid CSRF token. Security validation failed.');
}

const getAIResponse = require("../controllers/ai-assistant/getAIResponse");
const getMedicationInfo = require("../controllers/ai-assistant/getMedicationInfo");
const getHealthConditionInfo = require("../controllers/ai-assistant/getHealthConditionInfo");
const { getAIResponseValidator, getMedicationInfoValidator, getHealthConditionInfoValidator } = require("../controllers/ai-assistant/validators");

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, 'Validation error', errors.array());
  }
  next();
}

// Add a dedicated endpoint to get a CSRF token for the AI assistant
router.get('/csrf-token', csrfProtection, (req, res) => {
  console.log('[AI Assistant] CSRF token endpoint hit');
  const token = req.csrfToken();
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  return returnResponse(res, 200, true, { csrfToken: token });
});

// Add development-only endpoints that bypass security checks for local testing
if (process.env.NODE_ENV === 'development') {
  // Route with auth but no CSRF
  router.post('/dev/chat', protect, getAIResponseValidator, handleValidationErrors, (req, res) => {
    console.log('[AI DEV] Using development endpoint without CSRF validation');
    return getAIResponse(req, res);
  });
  
  // Super simplified debug route that bypasses validation but still has rate limiting
  router.post('/debug/chat', debugEndpointLimiter, (req, res) => {
    console.log('[AI DEBUG] Using completely unrestricted debug endpoint');
    console.log('[AI DEBUG] Request body:', req.body);
    
    // Create a fake user for the request to satisfy controller requirements
    req.user = { id: 999, name: 'Debug User', email: 'debug@example.com', role: 'user' };
    
    // Basic message validation only
    const message = req.body.message || 'Hello';
    
    try {
      // Use the Together AI service instead of OpenAI
      console.log('[AI DEBUG] Calling Together AI service with message:', message);
      
      const aiHelper = require('../controllers/ai-assistant/aiHelper');
      aiHelper.callTogetherAI({
        // Use the Mistral model which is widely available
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        messages: [
          {
            role: "system",
            // Shorter prompt to reduce processing time
            content: "You are a pharmacy AI. Provide brief, accurate information about medications and health conditions. Keep responses concise."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.5,  // Lower temperature for faster, more focused responses
        max_tokens: 300    // Limit token count for faster completion
      }).then(response => {
        return res.json({ success: true, data: { message: response } });
      }).catch(err => {
        console.error('[AI DEBUG] Error calling AI:', err);
        return res.status(500).json({ success: false, error: 'Error processing AI request' });
      });
    } catch (error) {
      console.error('[AI DEBUG] Error in debug endpoint:', error);
      return res.status(500).json({ success: false, error: 'Server error in debug endpoint' });
    }
  });
}

// Standard endpoint with CSRF protection and rate limiting
router.post("/chat", csrfProtection, csrfErrorHandler, protect, aiAssistantLimiter, getAIResponseValidator, handleValidationErrors, getAIResponse);
router.post("/medication-info", csrfProtection, csrfErrorHandler, protect, getMedicationInfoValidator, handleValidationErrors, getMedicationInfo);
router.post("/health-condition", csrfProtection, csrfErrorHandler, protect, getHealthConditionInfoValidator, handleValidationErrors, getHealthConditionInfo);

// New AI-powered endpoints
const getInteractions = require("../controllers/ai-assistant/getInteractions");
const getDosageRecommendation = require("../controllers/ai-assistant/getDosageRecommendation");
const analyzeSymptoms = require("../controllers/ai-assistant/analyzeSymptoms");
const { getInteractionsValidator, getDosageRecommendationValidator, analyzeSymptomsValidator } = require("../controllers/ai-assistant/validators");

router.post("/interactions", csrfProtection, csrfErrorHandler, protect, getInteractionsValidator, handleValidationErrors, getInteractions);
router.post("/dosage", csrfProtection, csrfErrorHandler, protect, getDosageRecommendationValidator, handleValidationErrors, getDosageRecommendation);
router.post("/analyze-symptoms", csrfProtection, csrfErrorHandler, protect, analyzeSymptomsValidator, handleValidationErrors, analyzeSymptoms);

module.exports = router;
