
function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(error);
  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "An unexpected server error occurred." : error.message,
  });
}

module.exports = { notFoundHandler, errorHandler };
