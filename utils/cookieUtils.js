// Set secure cookie options
const getCookieOptions = (expires) => {
  return {
    expires: new Date(Date.now() + expires),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    // domain: process.env.COOKIE_DOMAIN // Uncomment in production
  }
}

// Set token cookie
const setTokenCookie = (res, token, expires) => {
  res.cookie("token", token, getCookieOptions(expires))
}

// Clear token cookie
const clearTokenCookie = (res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  })
}

module.exports = {
  getCookieOptions,
  setTokenCookie,
  clearTokenCookie,
}
