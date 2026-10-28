
import { useEffect, useState } from "react";
import { createProduct } from "./api";
import "./AddProductModal.css";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "",
};

function AddProductModal({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0];
    setError("");

    if (!selectedFile) {
      setImage(null);
      setPreview("");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("The image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setImage(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const category = form.category.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name || !category || form.price === "" || form.stock === "") {
      setError("Please complete the product name, category, price, and stock.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Price must be a valid number greater than or equal to zero.");
      return;
    }

    if (
      form.stock.trim() === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("Stock must be a whole number greater than or equal to zero.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", form.description.trim());
    formData.append("price", String(price));
    formData.append("category", category);
    formData.append("stock", String(stock));

    if (image) {
      formData.append("image", image);
    }

    try {
      setLoading(true);

      await createProduct(formData);

      // Close after the server confirms that creation succeeded.
      onClose();

      // Refresh the list and dashboard statistics.
      try {
        await onCreated();
      } catch (refreshError) {
        console.error("Product saved, but inventory refresh failed:", refreshError);
      }
    } catch (err) {
      setError(err.message || "Could not create the product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="product-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <div className="product-modal-header">
          <div>
            <p className="product-modal-eyebrow">INVENTORY MANAGEMENT</p>
            <h2 id="product-modal-title">Add new product</h2>
            <p className="product-modal-subtitle">
              Enter product details and upload an optional image.
            </p>
          </div>

          <button
            type="button"
            className="product-modal-close"
            aria-label="Close dialog"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="product-form-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="product-form">
          <label>
            Product name *
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Wireless Mouse"
              maxLength={120}
              required
            />
          </label>

          <label>
            Category *
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="e.g. Electronics"
              maxLength={80}
              required
            />
          </label>

          <div className="product-form-row">
            <label>
              Price *
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </label>

            <label>
              Stock quantity *
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
                required
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the product..."
              rows={3}
              maxLength={2000}
            />
          </label>

          <div className="product-image-field">
            <label htmlFor="product-image">Product image (optional)</label>

            <input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            <p className="product-image-help">
              Select an image up to 5 MB.
            </p>

            {preview && (
              <div className="product-image-preview">
                <img src={preview} alt="Selected product preview" />

                <button
                  type="button"
                  className="product-remove-image"
                  onClick={() => {
                    setImage(null);
                    setPreview("");
                  }}
                >
                  Remove image
                </button>
              </div>
            )}
          </div>

          <div className="product-form-actions">
            <button
              type="button"
              className="product-button-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="product-button-primary"
              disabled={loading}
            >
              {loading ? "Saving product..." : "Save product"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AddProductModal;
