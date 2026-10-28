
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const createError = require("http-errors");
const User = require("../models/User");

const checkValidation = (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw createError(400, errors.array()[0].msg);
  }
};

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw createError(500, "JWT_SECRET is not configured");
  }

  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

const register = async (req, res, next) => {
  try {
    checkValidation(req);

    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw createError(409, "Email is already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    checkValidation(req);

    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw createError(401, "Invalid email or password");
    }

    const token = createToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
