const asyncHandler = require("../../utils/asyncHandler");
const returnResponse = require("../../utils/response");
const { callAI } = require("./aiHelper");

// @desc    Get health condition information
// @route   POST /api/ai-assistant/health-condition
// @access  Private
module.exports = asyncHandler(async (req, res) => {
  const { condition } = req.body;
  if (!condition) {
    return returnResponse(res, 400, false, null, "Please provide a health condition");
  }
  try {
    const aiResponse = await callAI({
      model: "Qwen/Qwen3-235B-A22B-fp8-tput",
      messages: [
        {
          role: "system",
          content:
            "You are a medical AI assistant. Only answer medical, health, or pharmacy-related questions. If the question is not about medicine, health, or pharmacy, politely refuse to answer and explain that you can only assist with medical topics. Provide factual information about health conditions including symptoms, causes, treatments, and prevention. Format the response in clear sections. Always include a disclaimer about consulting healthcare professionals for diagnosis and treatment.",
        },
        {
          role: "user",
          content: `Provide information about ${condition}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });
    returnResponse(res, 200, true, { condition, information: aiResponse });
  } catch (error) {
    console.error("OpenAI API Error:", error.message);
    return returnResponse(res, error.status || 500, false, null, error.message || "Failed to get health condition information");
  }
});
