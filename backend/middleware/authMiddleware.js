
const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const protect = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw createError(401, "Authentication token is required");
    }

    if (!process.env.JWT_SECRET) {
      throw createError(500, "JWT_SECRET is not configured");
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: decoded.userId };

    next();
  } catch (error) {
    if (error.status) {
      return next(error);
    }

    if (error.name === "TokenExpiredError") {
      return next(createError(401, "Token has expired"));
    }

    if (error.name === "JsonWebTokenError") {
      return next(createError(401, "Invalid authentication token"));
    }

    next(error);
  }
};

module.exports = { protect };
