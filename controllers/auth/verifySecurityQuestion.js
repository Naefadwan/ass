const asyncHandler = require("../../utils/asyncHandler");
const { User } = require('../../models');
const returnResponse = require("../../utils/response");

// @desc    Verify security question
// @route   POST /api/auth/verifysecurityquestion
// @access  Public
module.exports = asyncHandler(async (req, res) => {
  const { email, securityAnswer } = req.body;
  if (!email || !securityAnswer) {
    return returnResponse(res, 400, false, null, "Please provide an email and security answer");
  }
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return returnResponse(res, 404, false, null, "User not found");
  }
  const isMatch = await user.matchSecurityAnswer(securityAnswer);
  if (!isMatch) {
    return returnResponse(res, 401, false, null, "Invalid security answer");
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validate: false });
  returnResponse(res, 200, true, { resetToken });
});
