export function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatKSh(value) {
  const number = Number(value) || 0;
  return `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(number)}`;
}

export function priceLabel(product) {
  if (!product.fromPrice) {
    return "Free on request";
  }
  if (product.fromPrice === product.toPrice) {
    return formatKSh(product.fromPrice);
  }
  return `From ${formatKSh(product.fromPrice)}`;
}

export function icon(name, prefix = "", extraClass = "") {
  return `<svg class="icon ${extraClass}" aria-hidden="true"><use href="${prefix}Assets/icons/sprite.svg#i-${name}"></use></svg>`;
}

export function statusBadge(product, prefix = "") {
  const map = {
    clear: { className: "badge--clear", label: "Clear stock", icon: "check" },
    small: { className: "badge--small", label: "Small stock", icon: "info" },
    arriving: {
      className: "badge--arriving",
      label: "Arriving soon",
      icon: "clock",
    },
    out_of_stock: {
      className: "badge--out",
      label: "Out of stock",
      icon: "close",
    },
  };
  const status = map[product.status];
  if (!status) {
    return "";
  }
  return `<span class="badge ${status.className}">${icon(status.icon, prefix)}${status.label}</span>`;
}

export function hotBadge(product, prefix = "") {
  return product.hot
    ? `<span class="badge badge--hot">${icon("flame", prefix)}Hot</span>`
    : "";
}

export function productCardHTML(product, options = {}) {
  const prefix = options.prefix || "";
  const eager = Boolean(options.eager);
  const badge = hotBadge(product, prefix);
  const status = statusBadge(product, prefix);
  const image = `${prefix}${product.image}`;
  const href = `${prefix}product/${encodeURIComponent(product.slug)}.html`;
  const note =
    product.variantCount > 1
      ? `${product.variantCount} sizes`
      : product.sizes[0] || "";

  return `
    <a class="product-card" href="${href}">
      <div class="product-card__media">
        <img src="${image}" alt="${escapeHTML(product.name)}" width="800" height="600" loading="${eager ? "eager" : "lazy"}" decoding="async">
        <div class="product-card__badges">${badge}${status}</div>
      </div>
      <div class="product-card__body">
        <span class="product-card__cat">${escapeHTML(product.categoryName)}</span>
        <h3 class="product-card__name">${escapeHTML(product.name)}</h3>
        <p class="product-card__note">${escapeHTML(note)}</p>
        <span class="product-card__price">${priceLabel(product)}</span>
      </div>
    </a>`;
}

export function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function parseNumber(value) {
  const number = Number.parseInt(String(value).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(number) ? number : null;
}
