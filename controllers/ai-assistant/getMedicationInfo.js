const asyncHandler = require("../../utils/asyncHandler");
const returnResponse = require("../../utils/response");
const { callAI } = require("./aiHelper");

// @desc    Get medication information
// @route   POST /api/ai-assistant/medication-info
// @access  Private
module.exports = asyncHandler(async (req, res) => {
  const { medication } = req.body;
  if (!medication) {
    return returnResponse(res, 400, false, null, "Please provide a medication name");
  }
  try {
    const aiResponse = await callAI({
      model: "Qwen/Qwen3-235B-A22B-fp8-tput",
      messages: [
        {
          role: "system",
          content:
            "You are a medical AI assistant. Only answer medical, health, or pharmacy-related questions. If the question is not about medicine, health, or pharmacy, politely refuse to answer and explain that you can only assist with medical topics. Provide factual information about medications including uses, side effects, contraindications, and general guidance. Format the response in clear sections. Always include a disclaimer about consulting healthcare professionals.",
        },
        {
          role: "user",
          content: `Provide information about ${medication}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });
    returnResponse(res, 200, true, { medication, information: aiResponse });
  } catch (error) {
    console.error("OpenAI API Error:", error.message);
    return returnResponse(res, error.status || 500, false, null, error.message || "Failed to get medication information");
  }
});
