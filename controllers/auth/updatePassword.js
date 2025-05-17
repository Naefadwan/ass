const asyncHandler = require("../../utils/asyncHandler");
const { User } = require('../../models');
const returnResponse = require("../../utils/response");

// @desc    Update user password
// @route   PUT /api/auth/updatepassword
// @access  Private
module.exports = asyncHandler(async (req, res, next) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return returnResponse(res, 404, false, null, "User not found");
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return returnResponse(res, 401, false, null, "Password is incorrect");
  }
  user.password = req.body.newPassword;
  await user.save();
  returnResponse(res, 200, true, { message: "Password updated successfully" });
});
