
const API_BASE_URL = "http://localhost:5000/api";

async function request(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(
      "Cannot connect to the backend. Make sure your server is running on port 5000."
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message ||
        result.error ||
        `Request failed with HTTP ${response.status}`
    );
  }

  return result;
}

export async function getProducts() {
  const result = await request(`${API_BASE_URL}/products`);

  return Array.isArray(result)
    ? result
    : result.data ?? result.products ?? [];
}

export async function createProduct(formData) {
  // No login token required for product creation.
  // Do not manually set Content-Type for FormData.
  return request(`${API_BASE_URL}/products`, {
    method: "POST",
    body: formData,
  });
}
