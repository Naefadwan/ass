const jwt = require("jsonwebtoken")

// Generate JWT token with proper expiration and security
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  })
}

module.exports = generateToken
