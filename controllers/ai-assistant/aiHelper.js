const axios = require('axios');
const crypto = require('crypto');

// Simple in-memory cache for AI responses
const responseCache = {
  cache: {},
  maxSize: 100, // Maximum cache entries
  ttl: 7 * 24 * 60 * 60 * 1000, // Cache for 7 days
  
  // Generate a hash key from messages to use as cache key
  getKey(messages) {
    const contentString = messages.map(m => `${m.role}:${m.content}`).join('|');
    return crypto.createHash('md5').update(contentString).digest('hex');
  },
  
  // Check if a response is in cache and not expired
  get(messages) {
    const key = this.getKey(messages);
    const cached = this.cache[key];
    
    if (!cached) return null;
    
    // Check if the cached response has expired
    if (Date.now() > cached.expiresAt) {
      delete this.cache[key];
      return null;
    }
    
    console.log('[AI Cache] Cache hit!');
    return cached.response;
  },
  
  // Store a response in cache
  set(messages, response) {
    const key = this.getKey(messages);
    
    // Set expiration time
    const expiresAt = Date.now() + this.ttl;
    
    this.cache[key] = {
      response,
      expiresAt,
      createdAt: Date.now()
    };
    
    // Manage cache size - remove oldest entries if needed
    this.pruneCache();
    
    console.log('[AI Cache] Cached new response');
  },
  
  // Remove oldest entries when cache gets too large
  pruneCache() {
    const keys = Object.keys(this.cache);
    if (keys.length <= this.maxSize) return;
    
    // Sort by creation time, oldest first
    const sortedKeys = keys.sort((a, b) => 
      this.cache[a].createdAt - this.cache[b].createdAt
    );
    
    // Remove oldest entries until we're under the limit
    const keysToRemove = sortedKeys.slice(0, keys.length - this.maxSize);
    keysToRemove.forEach(key => delete this.cache[key]);
    
    console.log(`[AI Cache] Pruned ${keysToRemove.length} old entries`);
  }
};

/**
 * Calls the Together AI API (used as an alternative to OpenAI)
 * @param {Object} options
 * @param {string} [options.model] - The model to use (default: 'mistralai/Mixtral-8x7B-Instruct-v0.1')
 * @param {Array} options.messages - Array of message objects 
 * @param {number} [options.temperature] - Sampling temperature
 * @param {number} [options.max_tokens] - Maximum tokens for the response
 * @returns {Promise<string>} - The content of the AI's response
 * @throws {Error} - Throws error with message for logging and user feedback
 */
async function callTogetherAI({ model = 'mistralai/Mistral-7B-Instruct-v0.2', messages, temperature = 0.5, max_tokens = 300 }) {
  try {
    console.log('[Together AI] Making API request with model:', model);
    const startTime = Date.now();
    
    // Set stream to false to get faster non-streaming responses
    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model,
        messages,
        temperature,
        max_tokens,
        stream: false,         // Disable streaming for faster response
        top_p: 0.9,           // Optimize sampling parameters
        frequency_penalty: 0, // Reduce repetition penalty for speed
        presence_penalty: 0   // Simplify response generation
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000, // Reduced timeout to 15 seconds
      }
    );
    
    const endTime = Date.now();
    console.log(`[Together AI] Response received in ${endTime - startTime}ms`);
    
    if (!response.data.choices || !response.data.choices[0].message.content) {
      throw new Error('No AI response received from Together AI.');
    }
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('[Together AI] API Error:', error.response ? error.response.data : error);
    
    let errMsg = 'Unknown error with Together AI service.';
    if (error.response) {
      if (error.response.status === 401) {
        errMsg = 'Together AI service authentication failed. Please check API configuration.';
      } else if (error.response.data && error.response.data.error) {
        errMsg = `Together AI service error: ${error.response.data.error}`;
      } else {
        errMsg = `Together AI service error: ${error.response.statusText}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errMsg = 'Together AI service timed out.';
    } else if (error.message) {
      errMsg = error.message;
    }
    
    throw new Error(errMsg);
  }
}

/**
 * Calls the OpenAI Chat Completion API and returns the response content.
 * @param {Object} options
 * @param {string} [options.model] - The OpenAI model to use (default: 'gpt-3.5-turbo')
 * @param {Array} options.messages - Array of message objects for OpenAI API
 * @param {number} [options.temperature] - Sampling temperature
 * @param {number} [options.max_tokens] - Maximum tokens for the response
 * @returns {Promise<string>} - The content of the AI's response
 * @throws {Error} - Throws error with message for logging and user feedback
 */
async function callAI({ model = 'gpt-3.5-turbo', messages, temperature = 0.3, max_tokens = 400 }) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
        temperature,
        max_tokens,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000, // 20 seconds timeout
      }
    );
    if (!response.data.choices || !response.data.choices[0].message.content) {
      throw new Error('No AI response received.');
    }
    return response.data.choices[0].message.content;
  } catch (error) {
    let errMsg = 'Unknown error with AI service.';
    if (error.response) {
      if (error.response.status === 401) {
        errMsg = 'AI service authentication failed. Please check OpenAI API configuration.';
      } else if (error.response.data && error.response.data.error && error.response.data.error.message) {
        errMsg = `AI service error: ${error.response.data.error.message}`;
      } else {
        errMsg = `AI service error: ${error.response.statusText}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errMsg = 'AI service timed out.';
    } else if (error.message) {
      errMsg = error.message;
    }
    // Log detailed error for debugging but return only errMsg
    console.error('OpenAI API Error:', error.response ? error.response.data : error);
    const err = new Error(errMsg);
    err.status = error.response ? error.response.status : 500;
    throw err;
  }
}

// General AI service function that tries different providers in order
async function callAIService(options) {
  const { messages } = options;
  
  // Check cache first
  const cachedResponse = responseCache.get(messages);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // First try Together AI
    const response = await callTogetherAI(options);
    
    // Cache the successful response
    responseCache.set(messages, response);
    
    return response;
  } catch (togetherError) {
    console.log('[AI Service] Together AI failed, trying OpenAI...', togetherError.message);
    try {
      // Fall back to OpenAI
      const response = await callAI(options);
      
      // Cache the successful response
      responseCache.set(messages, response);
      
      return response;
    } catch (openAIError) {
      console.log('[AI Service] OpenAI also failed', openAIError.message);
      throw new Error('All AI services failed. Please try again later.');
    }
  }
}

module.exports = {
  callAI,
  callTogetherAI,
  callAIService
};
