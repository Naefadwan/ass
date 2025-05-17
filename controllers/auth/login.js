const asyncHandler = require("../../utils/asyncHandler");
const { User, AuditLog } = require('../../models');
const ErrorResponse = require("../../utils/errorResponse");
const returnResponse = require("../../utils/response");

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
module.exports = asyncHandler(async (req, res, next) => {
  console.log('[LOGIN] Incoming request:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[LOGIN] Missing email or password.');
      return next(new ErrorResponse("Please provide an email and password", 400));
    }

    console.log('[LOGIN] Looking up user:', email);
    const user = await User.scope("withPassword").findOne({ where: { email } });
    if (!user) {
      console.log('[LOGIN] No user found with email:', email);
      await AuditLog.create({
        action: "LOGIN_FAILED",
        resourceType: "Auth",
        details: JSON.stringify({ email, reason: "User not found" }),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      return next(new ErrorResponse("Invalid credentials", 401));
    }

  console.log('[LOGIN] Checking if account is locked for user:', email);
  if (user.isLocked()) {
    console.log('[LOGIN] Account locked for user:', email);
    await AuditLog.create({
      userId: user.id,
      action: "LOGIN_BLOCKED",
      resourceType: "User",
      resourceId: user.id,
      details: JSON.stringify({ reason: "Account locked", lockUntil: user.lockUntil }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return next(new ErrorResponse("Account locked due to too many failed attempts. Try again later.", 401));
  }

  const isMatch = await user.matchPassword(password);
  console.log('[LOGIN] Password match:', isMatch);
  if (!isMatch) {
    console.log('[LOGIN] Wrong password for user:', email);
    await user.incrementLoginAttempts();
    await AuditLog.create({
      userId: user.id,
      action: "LOGIN_FAILED",
      resourceType: "User",
      resourceId: user.id,
      details: JSON.stringify({ email: user.email, reason: "Wrong password" }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  await user.resetLoginAttempts();
  user.lastLogin = new Date();
  await user.save();

  await AuditLog.create({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    resourceType: "User",
    resourceId: user.id,
    details: JSON.stringify({ email: user.email }),
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  // Set JWT cookie and respond
  const token = user.getSignedJwtToken();
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || undefined,
  });

  const userData = { ...user.get() };
  delete userData.password;
  delete userData.resetPasswordToken;
  delete userData.resetPasswordExpire;
  delete userData.twoFactorSecret;

  returnResponse(res, 200, true, userData);
});
