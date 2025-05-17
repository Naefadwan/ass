/**
 * Async handler to wrap async route handlers and middleware
 * Eliminates the need for try/catch blocks in route handlers
 * This version has NO dependencies to avoid circular references
 * 
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - Express middleware function
 */
module.exports = function asyncHandler(fn) {
  // Simple function name extraction without dependencies
  const fnName = fn.name || 'anonymous function';
 
  
  return function asyncHandlerWrapper(req, res, next) {
    console.log(`[AsyncHandler] Executing: ${fnName} for ${req.method} ${req.originalUrl}`);
    
    Promise.resolve(fn(req, res, next))
      .catch(err => {
        console.error(`[AsyncHandler] Error in ${fnName}: ${err.message}`);
        next(err);
      });
  };
};