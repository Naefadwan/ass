const asyncHandler = require("../../utils/asyncHandler");
const { AuditLog } = require('../../models');
const { clearTokenCookie } = require("../../utils/cookieUtils");
const returnResponse = require("../../utils/response");

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
module.exports = asyncHandler(async (req, res, next) => {
  clearTokenCookie(res);
  // Optionally log the logout event if user is authenticated
  if (req.user) {
    await AuditLog.create({
      userId: req.user.id,
      action: "LOGOUT",
      resourceType: "User",
      resourceId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }
  returnResponse(res, 200, true, { message: "Logged out successfully" });
});
