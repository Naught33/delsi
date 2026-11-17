import { formatKSh } from "./ui.js";

// Fills live "from" prices and category counts from products.json.
// If the fetch fails the static fallback text in the markup stays in place.
async function initHome() {
  let data;
  try {
    const response = await fetch("products.json");
    if (!response.ok) {
      throw new Error("Could not load products");
    }
    data = await response.json();
  } catch {
    for (const el of document.querySelectorAll("[data-from-price]:not([data-bare])")) {
      el.textContent = "View sizes and prices";
    }
    return;
  }
  for (const el of document.querySelectorAll("[data-from-price]")) {
    const product = data.products.find((item) => item.slug === el.dataset.fromPrice);
    if (product && product.fromPrice) {
      el.textContent = el.hasAttribute("data-bare")
        ? formatKSh(product.fromPrice)
        : `From ${formatKSh(product.fromPrice)}`;
    } else if (!el.hasAttribute("data-bare")) {
      el.textContent = "View sizes and prices";
    }
  }
  for (const el of document.querySelectorAll("[data-category-count]")) {
    const category = data.categories.find((entry) => entry.id === el.dataset.categoryCount);
    if (category) {
      el.textContent = `${category.productCount} ${category.productCount === 1 ? "product" : "products"}`;
    }
  }
}

initHome();
