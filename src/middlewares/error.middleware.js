// 404 not found handler middleware
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`
  });
};

// global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  console.error('Server error:', err.stack || err.message);
  
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
