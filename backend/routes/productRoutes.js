
const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategoryStats,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");

// Read products without login
router.get("/", getProducts);
router.get("/stats/categories", getCategoryStats);
router.get("/:id", getProductById);

// Add products without login
router.post("/", upload.single("image"), createProduct);

// Keep editing and deleting protected
router.put("/:id", protect, upload.single("image"), updateProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;
