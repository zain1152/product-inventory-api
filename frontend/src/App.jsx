
import { useEffect, useMemo, useState } from "react";
import { getProducts } from "./api";
import AddProductModal from "./AddProductModal";
import "./App.css";

const money = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount) || 0);

const getStatus = (stock) => {
  if (Number(stock) <= 0) return "Out of Stock";
  if (Number(stock) <= 10) return "Low Stock";
  return "In Stock";
};

const getColor = (name = "") => {
  const colors = ["purple", "blue", "orange", "green", "pink"];

  return colors[
    [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      colors.length
  ];
};

const formatProduct = (product) => ({
  ...product,
  id: product._id,
  status: getStatus(product.stock),
  color: getColor(product.name),
});

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();

        if (!cancelled) {
          setProducts(data.map(formatProduct));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load products. Check that your backend is running."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalProducts = products.length;

    const totalUnits = products.reduce(
      (sum, product) => sum + (Number(product.stock) || 0),
      0
    );

    const inventoryValue = products.reduce(
      (sum, product) =>
        sum +
        (Number(product.price) || 0) * (Number(product.stock) || 0),
      0
    );

    const lowStock = products.filter(
      (product) =>
        Number(product.stock) > 0 && Number(product.stock) <= 10
    ).length;

    const outOfStock = products.filter(
      (product) => Number(product.stock) <= 0
    ).length;

    return {
      totalProducts,
      totalUnits,
      inventoryValue,
      lowStock,
      outOfStock,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.category,
        product.description,
        product._id,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && product.status === "Low Stock") ||
        (stockFilter === "out" && product.status === "Out of Stock");

      return matchesSearch && matchesStock;
    });
  }, [products, search, stockFilter]);

  const refreshProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProducts();
      setProducts(data.map(formatProduct));
    } catch (err) {
      setError(err.message || "Unable to refresh products.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-mark">N</span>
          <span>
            NEXUS<span className="brand-dot">.</span>
          </span>
        </a>

        <div className="workspace">
          <span className="workspace-icon">N</span>
          <div>
            <strong>My Workspace</strong>
            <small>Inventory Manager</small>
          </div>
          <span className="workspace-arrow">⌄</span>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav className="navigation">
          <a className="nav-item active" href="#">
            <span>▦</span> Overview
          </a>

          <a className="nav-item" href="#products">
            <span>□</span> Products
            <span className="nav-count">{metrics.totalProducts}</span>
          </a>

          <a className="nav-item" href="#products">
            <span>◫</span> Categories
          </a>

          <a className="nav-item" href="#products">
            <span>⇅</span> Stock Management
          </a>
        </nav>

        <p className="nav-label">PREFERENCES</p>

        <nav className="navigation">
          <a className="nav-item" href="#reports">
            <span>▤</span> Reports
          </a>

          <a className="nav-item" href="#settings">
            <span>⚙</span> Settings
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <span className="upgrade-symbol">✦</span>
            <strong>Your workspace</strong>
            <p>Keep your inventory organized and up to date.</p>
          </div>

          <div className="profile">
            <div className="avatar">ZA</div>
            <div className="profile-info">
              <strong>Workspace Admin</strong>
              <small>Administrator</small>
            </div>
            <span>•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <span>/</span> <strong>Overview</strong>
          </div>

          <div className="topbar-actions">
            <span className="system-status">
              <span className="status-dot" />
              {error ? "Connection issue" : "Inventory dashboard"}
            </span>

            <button
              className="icon-button"
              aria-label="Refresh inventory"
              title="Refresh inventory"
              onClick={refreshProducts}
              disabled={loading}
            >
              ↻
            </button>

            <div className="avatar top-avatar">ZA</div>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">INVENTORY MANAGEMENT</p>

              <h1>
                Inventory overview <span>✳</span>
              </h1>

              <p className="muted">
                Monitor your products, stock levels, and inventory value.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => setShowAddProduct(true)}
            >
              <span>＋</span> Add product
            </button>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: "14px 16px",
                marginBottom: 20,
                border: "1px solid #713b48",
                background: "#28181f",
                color: "#fda4af",
                borderRadius: 9,
                fontSize: 12,
              }}
            >
              <strong>Unable to load inventory.</strong> {error}

              <button
                onClick={refreshProducts}
                style={{
                  marginLeft: 12,
                  background: "transparent",
                  border: "1px solid #713b48",
                  color: "inherit",
                  borderRadius: 5,
                  padding: "5px 9px",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span>Total products</span>
                <span className="stat-icon violet">▦</span>
              </div>

              <h2>
                {loading ? "—" : metrics.totalProducts.toLocaleString()}
              </h2>

              <p>
                <span className="muted">Unique product records</span>
              </p>

              <div className="mini-bars">
                {[30, 45, 37, 60, 48, 72, 54, 82, 65, 95, 76, 100].map(
                  (height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  )
                )}
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Inventory value</span>
                <span className="stat-icon blue">＄</span>
              </div>

              <h2>{loading ? "—" : money(metrics.inventoryValue)}</h2>

              <p>
                <span className="muted">Price × units in stock</span>
              </p>

              <div className="mini-bars blue-bars">
                {[50, 35, 60, 42, 72, 56, 80, 65, 88, 70, 90, 100].map(
                  (height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  )
                )}
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Low stock items</span>
                <span className="stat-icon amber">⚠</span>
              </div>

              <h2>{loading ? "—" : metrics.lowStock}</h2>

              <p>
                <span className="warning-text">Needs attention</span>
                <span className="muted"> · 1–10 units</span>
              </p>

              <div className="stock-progress">
                <span
                  style={{
                    width: `${
                      metrics.totalProducts
                        ? (metrics.lowStock / metrics.totalProducts) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <small className="progress-label">
                Products at or below the low-stock threshold
              </small>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Out of stock</span>
                <span className="stat-icon red">⊘</span>
              </div>

              <h2>{loading ? "—" : metrics.outOfStock}</h2>

              <p>
                <span className="danger-text">Requires action</span>
              </p>

              <div className="out-of-stock-note">
                <span>↗</span> Restock recommended
              </div>
            </article>
          </div>

          <section className="panel products-panel" id="products">
            <div className="panel-heading">
              <div>
                <h3>Products inventory</h3>
                <p className="muted">
                  Live product records loaded from your database.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={refreshProducts}
                disabled={loading}
              >
                ↻ Refresh products
              </button>
            </div>

            <div className="table-toolbar">
              <div className="search-box">
                <span>⌕</span>

                <input
                  aria-label="Search products"
                  placeholder="Search name, category, or ID..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                {search && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    style={{
                      background: "transparent",
                      color: "#aaa",
                      border: 0,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                className="filter-button"
                aria-label="Filter by stock status"
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
              >
                <option value="all">All stock statuses</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </div>

            <div className="table-wrap">
              <table id="product-table">
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>PRODUCT ID</th>
                    <th>CATEGORY</th>
                    <th>PRICE</th>
                    <th>STOCK</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6}>
                        Loading products from your database...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6}>Products could not be loaded.</td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        {products.length === 0
                          ? "No products found. Add your first product."
                          : "No products match your search or filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <div className="product-name">
                            {product.image ? (
                              <img
                                className="product-thumb"
                                src={`http://localhost:5000${product.image}`}
                                alt={product.name}
                                style={{ objectFit: "cover" }}
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span
                                className={`product-thumb ${product.color}`}
                              >
                                {String(product.name || "P")
                                  .split(" ")
                                  .map((word) => word[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </span>
                            )}

                            <strong>{product.name}</strong>
                          </div>
                        </td>

                        <td className="id-cell">
                          {String(product._id || "")
                            .slice(-8)
                            .toUpperCase()}
                        </td>

                        <td>{product.category || "Uncategorized"}</td>

                        <td className="price-cell">
                          {money(product.price)}
                        </td>

                        <td>{Number(product.stock) || 0} units</td>

                        <td>
                          <span
                            className={`badge ${product.status
                              .toLowerCase()
                              .replaceAll(" ", "-")}`}
                          >
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                Showing <strong>{filteredProducts.length}</strong> of{" "}
                <strong>{products.length}</strong> products
              </span>

              <button
                className="secondary-button"
                onClick={() => {
                  setSearch("");
                  setStockFilter("all");
                }}
              >
                Clear filters
              </button>
            </div>
          </section>

          <footer className="page-footer">
            <span>© 2026 NEXUS Inventory</span>

            <span>
              Live inventory management{" "}
              <span className="footer-heart">✦</span>
            </span>
          </footer>
        </section>
      </main>

      {showAddProduct && (
        <AddProductModal
          onClose={() => setShowAddProduct(false)}
          onCreated={refreshProducts}
        />
      )}
    </div>
  );
}

export default App;
