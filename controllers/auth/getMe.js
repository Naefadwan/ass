const asyncHandler = require("../../utils/asyncHandler");
const { User } = require('../../models');
const returnResponse = require("../../utils/response");

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
module.exports = asyncHandler(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password", "resetPasswordToken", "resetPasswordExpire", "twoFactorSecret"] },
  });
  returnResponse(res, 200, true, user);
});
