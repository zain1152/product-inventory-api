
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

const app = express();

// Security headers
app.use(helmet());

// CORS configuration for the React/Vite frontend
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header, such as local tools.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: "10kb" }));

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// Health-check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Product Inventory API is running",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Product CRUD routes
app.use("/api/products", productRoutes);

// Serve uploaded product images
app.use("/uploads", express.static("uploads"));

// Handle unknown routes
app.use(notFound);

// Centralized error handler — must remain last
app.use(errorHandler);

// Start the server after connecting to MongoDB
const startServer = async () => {
  try {
    await connectDB();

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
