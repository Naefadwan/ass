const asyncHandler = require("../../utils/asyncHandler");
const { User } = require('../../models');
const ErrorResponse = require("../../utils/errorResponse");
const sendEmail = require("../../utils/sendEmail");
const returnResponse = require("../../utils/response");

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
module.exports = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { email: req.body.email } });
  if (!user) {
    return returnResponse(res, 404, false, null, "User not found");
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validate: false });
  const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/resetpassword/${resetToken}`;
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });
    returnResponse(res, 200, true, { message: "Email sent" });
  } catch (err) {
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save({ validate: false });
    return returnResponse(res, 500, false, null, "Email could not be sent");
  }
});
