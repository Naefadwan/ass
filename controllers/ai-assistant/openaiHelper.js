const axios = require('axios');

/**
 * Calls the Together AI Chat Completion API and returns the response content.
 * @param {Object} options
 * @param {string} [options.model] - The Together AI model to use (default: 'Qwen/Qwen3-235B-A22B-fp8-tput')
 * @param {Array} options.messages - Array of message objects for Together API
 * @param {number} [options.temperature] - Sampling temperature
 * @param {number} [options.max_tokens] - Maximum tokens for the response
 * @param {boolean} [options.stream] - Whether to stream the response (default: false)
 * @returns {Promise<string>} - The content of the AI's response
 * @throws {Error} - Throws error with message for logging and user feedback
 */
async function callOpenAI({ model = 'Qwen/Qwen3-235B-A22B-fp8-tput', messages, temperature = 0.3, max_tokens = 400, stream = false }) {
  try {
    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model,
        messages,
        temperature,
        max_tokens,
        stream,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
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
        errMsg = 'AI service authentication failed. Please check Together API configuration.';
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
    console.error('Together AI API Error:', error.response ? error.response.data : error);
    const err = new Error(errMsg);
    err.status = error.response ? error.response.status : 500;
    throw err;
  }
}

module.exports = { callOpenAI };

