function errorHandler(err, req, res, next) {
  console.error('[Error Middleware]:', err);

  const statusCode = err.statusCode || res.statusCode !== 200 ? (err.statusCode || 500) : 500;
  
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    errors: err.errors || [err.message || 'Internal Server Error'],
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = errorHandler;

