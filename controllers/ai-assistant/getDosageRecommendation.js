const asyncHandler = require("../../utils/asyncHandler");
const returnResponse = require("../../utils/response");
const { callAI } = require("./aiHelper");


// @desc    Get dosage recommendation for a medication
// @route   POST /api/ai-assistant/dosage
// @access  Private
module.exports = asyncHandler(async (req, res) => {

  const { medicineId, patientAge, patientWeight, condition } = req.body;
  if (!medicineId || !patientAge || !patientWeight || !condition) {
    return returnResponse(res, 400, false, null, "Missing required fields for dosage recommendation.");
  }
  // Example: Use OpenAI to generate dosage recommendation (replace with real clinical logic for production)
  const prompt = `Recommend a dosage for medicine ID ${medicineId} for a ${patientAge}-year-old, ${patientWeight}kg patient with condition: ${condition}.`;
  try {
    const recommendation = await callAI({
      model: "Qwen/Qwen3-235B-A22B-fp8-tput",
      messages: [
        { role: "system", content: "You are a medical AI assistant. Only answer medical, health, or pharmacy-related questions. If the question is not about medicine, health, or pharmacy, politely refuse to answer and explain that you can only assist with medical topics. Provide general dosage recommendations based on provided data, but always advise consulting a doctor." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    });
    returnResponse(res, 200, true, { recommendation });
  } catch (error) {
    console.error("Dosage Recommendation Error:", error.message);
    return returnResponse(res, error.status || 500, false, null, error.message || "Failed to get dosage recommendation.");
  }
});
