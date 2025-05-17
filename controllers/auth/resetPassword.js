const asyncHandler = require("../../utils/asyncHandler");
const { User } = require('../../models');
const { Op } = require("sequelize");
const returnResponse = require("../../utils/response");

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
module.exports = asyncHandler(async (req, res) => {
  const crypto = require("crypto");
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex");
  const user = await User.findOne({
    where: {
      resetPasswordToken,
      resetPasswordExpire: { [Op.gt]: Date.now() },
    },
  });
  if (!user) {
    return returnResponse(res, 400, false, null, "Invalid or expired token");
  }
  user.password = req.body.password;
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save();
  returnResponse(res, 200, true, { message: "Password reset successful" });
});
