const ErrorResponse = require("../utils/errorResponse")

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message
  error.details = err.details

  // Log error for debugging (but not in tests)
  if (process.env.NODE_ENV !== "test") {
    console.error("Error name:", err.name)
    console.error("Error message:", err.message)
    console.error("Error stack:", err.stack)
  }

  // Sequelize unique constraint error
  if (err.name === "SequelizeUniqueConstraintError") {
    const message = "Duplicate field value entered"
    const details = err.errors.map((e) => ({
      field: e.path,
      message: `${e.path} already exists`,
    }))
    error = new ErrorResponse(message, 400, details)
  }

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    const message = "Validation Error"
    const details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }))
    error = new ErrorResponse(message, 400, details)
  }

  // Sequelize database error
  if (err.name === "SequelizeDatabaseError") {
    const message = "Database Error"
    error = new ErrorResponse(message, 500)
  }

  // Sequelize foreign key constraint error
  if (err.name === "SequelizeForeignKeyConstraintError") {
    const message = "Referenced record does not exist"
    error = new ErrorResponse(message, 404)
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token"
    error = new ErrorResponse(message, 401)
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired"
    error = new ErrorResponse(message, 401)
  }

  // CSRF token error
  if (err.code === "EBADCSRFTOKEN") {
    const message = "Invalid CSRF token. Please refresh the page and try again."
    error = new ErrorResponse(message, 403)
  }

  // File upload error
  if (err.code === "LIMIT_FILE_SIZE") {
    const message = `File size exceeds the limit of ${process.env.MAX_FILE_UPLOAD / (1024 * 1024)} MB`
    error = new ErrorResponse(message, 400)
  }

  // Send standardized error response using response utility
const returnResponse = require("../utils/response");
returnResponse(
  res,
  error.statusCode || 500,
  false,
  null,
  error.message || "Server Error",
  process.env.NODE_ENV === "development" ? error.details : undefined
);
}

module.exports = errorHandler
