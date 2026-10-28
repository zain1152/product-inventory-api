
const express = require("express");
const { body } = require("express-validator");
const { register, login } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const registrationRules = [
  body("name")
    .isString()
    .withMessage("Name must be text")
    .bail()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),

  body("email")
    .isEmail()
    .withMessage("Enter a valid email address")
    .bail()
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Password must be text")
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be between 8 and 72 characters"),
];

const loginRules = [
  body("email")
    .isEmail()
    .withMessage("Enter a valid email address")
    .bail()
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Password is required")
    .bail()
    .notEmpty()
    .withMessage("Password is required"),
];

router.post("/register", registrationRules, register);
router.post("/login", loginRules, login);

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You are authenticated",
    userId: req.user.id,
  });
});

module.exports = router;
