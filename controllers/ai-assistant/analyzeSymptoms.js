const asyncHandler = require("../../utils/asyncHandler");
const returnResponse = require("../../utils/response");
const { callAI } = require("./aiHelper");

// @desc    Analyze symptoms and provide recommendations
// @route   POST /api/ai-assistant/analyze-symptoms
// @access  Private
module.exports = asyncHandler(async (req, res) => {
  const { symptoms, duration } = req.body;
  if (!Array.isArray(symptoms) || symptoms.length === 0 || !duration) {
    return returnResponse(res, 400, false, null, "Please provide symptoms (array) and duration.");
  }
  // Use OpenAI to analyze symptoms (replace with real clinical API for production)
  const prompt = `A patient reports the following symptoms: ${symptoms.join(", ")}, lasting for ${duration}. What could be the possible causes and general advice?`;
  try {
    const analysis = await callAI({
      model: "Qwen/Qwen3-235B-A22B-fp8-tput",
      messages: [
        { role: "system", content: "You are a pharmacy AI. Analyze symptoms and provide general advice, but never diagnose or prescribe. Always recommend seeing a healthcare professional. Only answer medical, health, or pharmacy-related questions. If the question is not about medicine, health, or pharmacy, politely refuse to answer and explain that you can only assist with medical topics." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 400
    });
    // Optionally, split advice and recommendations if AI response is structured
    returnResponse(res, 200, true, { analysis, recommendations: analysis });
  } catch (error) {
    console.error("Symptom Analysis Error:", error.message);
    return returnResponse(res, error.status || 500, false, null, error.message || "Failed to analyze symptoms.");
  }
});
