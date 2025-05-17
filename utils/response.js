// utils/response.js
/**
 * Standard API response utility for consistent frontend consumption.
 * Usage: returnResponse(res, 200, true, data) or returnResponse(res, 400, false, null, 'Error message')
 */
function returnResponse(res, statusCode, success, data = null, error = null, details = null) {
  const resp = { success };
  if (data !== null) resp.data = data;
  if (error !== null) resp.error = error;
  if (details !== null) resp.details = details;
  res.status(statusCode).json(resp);
}

module.exports = returnResponse;
