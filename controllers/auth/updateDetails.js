const asyncHandler = require("../../utils/asyncHandler");
const { User } = require('../../models');
const ErrorResponse = require("../../utils/errorResponse");
const returnResponse = require("../../utils/response");

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
module.exports = asyncHandler(async (req, res, next) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return next(new ErrorResponse("User not found", 404));
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
  };
  Object.assign(user, fieldsToUpdate);
  await user.save();
  returnResponse(res, 200, true, user);
});
