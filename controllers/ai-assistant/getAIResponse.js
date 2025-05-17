const asyncHandler = require("../../utils/asyncHandler");
const returnResponse = require("../../utils/response");
const { callAI } = require("./aiHelper");

// @desc    Get AI assistant response
// @route   POST /api/ai-assistant/chat
// @access  Private
module.exports = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return returnResponse(res, 400, false, null, "Please provide a message");
  }
  try {
    const aiResponse = await callAI({
      model: "Qwen/Qwen3-235B-A22B-fp8-tput",
      messages: [
        {
          role: "system",
          content:
            "You are a pharmacy AI. Provide accurate information about medications, health conditions, and general wellness advice. Only answer medical, health, or pharmacy-related questions. If the question is not about medicine, health, or pharmacy, politely refuse to answer and explain that you can only assist with medical topics. Always remind users to consult healthcare professionals for medical advice. Do not prescribe medications or make specific treatment recommendations.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    returnResponse(res, 200, true, { message: aiResponse });
  } catch (error) {
    console.error("OpenAI API Error:", error.message);
    return returnResponse(res, error.status || 500, false, null, error.message || "Failed to get response from AI assistant");
  }
});
