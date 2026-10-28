
const mongoose = require("mongoose");
const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");

// Remove an uploaded image if a request fails
const removeUploadedFile = (req) => {
  if (!req.file) return;

  const filePath = path.join(
    __dirname,
    "..",
    "uploads",
    req.file.filename
  );

  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Could not remove uploaded file:", err.message);
    }
  });
};

// Create a product WITHOUT requiring login
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      price === undefined ||
      price === "" ||
      typeof category !== "string" ||
      !category.trim() ||
      stock === undefined ||
      stock === ""
    ) {
      removeUploadedFile(req);

      return res.status(400).json({
        success: false,
        message: "Name, price, category, and stock are required.",
      });
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    // Validate price and stock
    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      !Number.isInteger(numericStock) ||
      numericStock < 0
    ) {
      removeUploadedFile(req);

      return res.status(400).json({
        success: false,
        message:
          "Price must be non-negative and stock must be a non-negative integer.",
      });
    }

    // Build the product without requiring an authenticated user
    const productData = {
      name: name.trim(),
      description:
        typeof description === "string" ? description.trim() : "",
      price: numericPrice,
      category: category.trim(),
      stock: numericStock,
      image: req.file ? `/uploads/${req.file.filename}` : "",
    };

    // Associate a user only when authentication is available
    const userId = req.user?._id || req.user?.id;

    if (userId) {
      productData.createdBy = userId;
    }

    const product = await Product.create(productData);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    removeUploadedFile(req);
    next(error);
  }
};

// Get all products with search, filtering, sorting, and pagination
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      search,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { category: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const allowedSortFields = [
      "name",
      "price",
      "stock",
      "createdAt",
      "category",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const safeOrder = order === "asc" ? 1 : -1;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ [safeSortBy]: safeOrder })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get one product by ID
const getProductById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Update a product, including its image
const updateProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      removeUploadedFile(req);

      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "category",
      "stock",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (
        typeof updates.name !== "string" ||
        !updates.name.trim()
      ) {
        removeUploadedFile(req);

        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty.",
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.category !== undefined) {
      if (
        typeof updates.category !== "string" ||
        !updates.category.trim()
      ) {
        removeUploadedFile(req);

        return res.status(400).json({
          success: false,
          message: "Product category cannot be empty.",
        });
      }

      updates.category = updates.category.trim();
    }

    if (updates.description !== undefined) {
      if (typeof updates.description !== "string") {
        removeUploadedFile(req);

        return res.status(400).json({
          success: false,
          message: "Description must be text.",
        });
      }

      updates.description = updates.description.trim();
    }

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }

    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);
    }

    if (
      (updates.price !== undefined &&
        (!Number.isFinite(updates.price) ||
          updates.price < 0)) ||
      (updates.stock !== undefined &&
        (!Number.isInteger(updates.stock) ||
          updates.stock < 0))
    ) {
      removeUploadedFile(req);

      return res.status(400).json({
        success: false,
        message:
          "Price must be non-negative and stock must be a non-negative integer.",
      });
    }

    // Store the uploaded image path
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      removeUploadedFile(req);

      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    removeUploadedFile(req);
    next(error);
  }
};

// Delete a product and its associated local image
const deleteProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (product.image && product.image.startsWith("/uploads/")) {
      const filename = path.basename(product.image);

      const imagePath = path.join(
        __dirname,
        "..",
        "uploads",
        filename
      );

      fs.unlink(imagePath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error(
            "Could not remove product image:",
            err.message
          );
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// Get product statistics by category
const getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          productCount: { $sum: 1 },
          averagePrice: { $avg: "$price" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          productCount: 1,
          averagePrice: {
            $round: ["$averagePrice", 2],
          },
        },
      },
      {
        $sort: { category: 1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategoryStats,
};
