
const createError = require("http-errors");

const notFound = (req, res, next) => {
  next(createError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  // Return detailed Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // Handle invalid MongoDB IDs
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource ID",
    });
  }

  // Handle duplicate unique fields
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
    });
  }

  const status = err.status || err.statusCode || 500;

  return res.status(status).json({
    success: false,
    message:
      status >= 500 && process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Something went wrong",
  });
};

module.exports = { notFound, errorHandler };
