const rateLimit = require("express-rate-limit")
const xss = require("xss-clean")
const hpp = require("hpp")
const helmet = require("helmet")
const cors = require("cors")
const mongoSanitize = require("express-mongo-sanitize")

// Rate limiting middleware
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, error: message },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// Standard API rate limiter
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  "Too many requests from this IP, please try again after 15 minutes",
)

// More strict rate limiter for auth routes
const authLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 requests per window
  "Too many authentication attempts, please try again after an hour",
)

// Very strict rate limiter for sensitive operations
const sensitiveOpLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 requests per window
  "Too many sensitive operations, please try again after an hour",
)

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:3000",
      // Add other allowed origins here
    ]

    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  exposedHeaders: ["X-CSRF-Token"],
  maxAge: 86400, // 24 hours
}

// Apply security middleware
const applySecurityMiddleware = (app) => {
  // Set security headers
  app.use(helmet())

  // Content Security Policy
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://placeholder.com"],
        connectSrc: ["'self'", process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    }),
  )

  // Enable CORS
  app.use(cors(corsOptions))

  // Prevent XSS attacks
  app.use(xss())

  // Prevent HTTP param pollution
  app.use(hpp())

  // Sanitize data to prevent NoSQL injection
  app.use(mongoSanitize())

  // Apply rate limiting to routes
  app.use("/api/", apiLimiter)
  app.use("/api/auth/login", authLimiter)
  app.use("/api/auth/register", authLimiter)
  app.use("/api/auth/forgotpassword", authLimiter)
  app.use("/api/auth/resetpassword", sensitiveOpLimiter)
  app.use("/api/users", sensitiveOpLimiter)

  return app
}

module.exports = {
  applySecurityMiddleware,
  apiLimiter,
  authLimiter,
  sensitiveOpLimiter,
}
