const asyncHandler = require("../../utils/asyncHandler");
const returnResponse = require("../../utils/response");
const { callAI } = require("./aiHelper");

// @desc    Check for drug interactions
// @route   POST /api/ai-assistant/interactions
// @access  Private
module.exports = asyncHandler(async (req, res) => {
  const { medications } = req.body;
  if (!Array.isArray(medications) || medications.length < 2) {
    return returnResponse(res, 400, false, null, "Please provide at least two medications to check interactions.");
  }
  // Example: Use OpenAI to analyze interactions (replace with real API for production)
  const prompt = `Check for drug interactions between: ${medications.join(", ")}.`;
  try {
    const interactions = await callAI({
      model: "Qwen/Qwen3-235B-A22B-fp8-tput",
      messages: [
        { role: "system", content: "You are a medical AI assistant. Only answer medical, health, or pharmacy-related questions. If the question is not about medicine, health, or pharmacy, politely refuse to answer and explain that you can only assist with medical topics. Given a list of medications, return potential interactions and advice. Always warn users to consult a healthcare professional." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    });
    returnResponse(res, 200, true, { interactions });
  } catch (error) {
    console.error("Interaction Check Error:", error.message);
    return returnResponse(res, error.status || 500, false, null, error.message || "Failed to check drug interactions.");
  }
});
