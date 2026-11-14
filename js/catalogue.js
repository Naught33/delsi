import { debounce, escapeHTML, formatKSh, icon, parseNumber, productCardHTML } from "./ui.js";
import { waLink } from "./whatsapp.js";
import { openDialog, watchDialog } from "./prefs.js";

const PER_PAGE = 12;
const SORTS = ["recommended", "price-asc", "price-desc", "name"];
const OFFERS = ["hot", "discount", "tradein", "clearance"];
const OFFER_LABELS = {
  hot: "Hot",
  discount: "Discount",
  tradein: "Trade-in offer",
  clearance: "Clearance",
};
const PRICE_PRESETS = [
  { value: "0-999", label: "Under 1,000", min: 0, max: 999 },
  { value: "1000-10000", label: "1,000 to 10,000", min: 1000, max: 10000 },
  {
    value: "10000-100000",
    label: "10,000 to 100,000",
    min: 10000,
    max: 100000,
  },
  { value: "100001-", label: "Over 100,000", min: 100001, max: null },
];

const elements = {
  search: document.getElementById("catalogue-search"),
  sort: document.getElementById("catalogue-sort"),
  results: document.getElementById("results-grid"),
  count: document.getElementById("result-count"),
  chips: document.getElementById("active-filters"),
  pagination: document.getElementById("pagination"),
  filterToggle: document.querySelector("[data-open-filters]"),
  filterCount: document.querySelector("[data-filter-count]"),
  sheet: document.getElementById("filters-sheet"),
  desktopFilters: document.querySelector(".filters [data-filters]"),
  sheetFilters: document.querySelector("#filters-sheet [data-filters]"),
  resultsHeading: document.getElementById("results-heading"),
};

const blankState = () => ({
  q: "",
  categories: [],
  priceMin: null,
  priceMax: null,
  avail: false,
  offers: [],
  sort: "recommended",
  page: 1,
});

let state = blankState();
let draft = blankState();
let categories = [];
let products = [];
let loaded = false;
let explicitSort = false;

function isMobile() {
  return window.matchMedia("(max-width: 1023px)").matches;
}

function uniqueValid(values, allowed) {
  return [...new Set(values)].filter((value) => allowed.has(value));
}

function parsePrice(value) {
  const match = String(value || "").match(/^(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2])) {
    return { min: null, max: null };
  }
  let min = match[1] ? Number.parseInt(match[1], 10) : null;
  let max = match[2] ? Number.parseInt(match[2], 10) : null;
  if (min !== null && max !== null && min > max) {
    [min, max] = [max, min];
  }
  return { min, max };
}

function parseState() {
  const params = new URLSearchParams(window.location.search);
  const next = blankState();
  next.q = (params.get("q") || "").trim().slice(0, 120);

  const categoryIds = new Set(categories.map((category) => category.id));
  next.categories = uniqueValid(
    (params.get("category") || "").split(",").map((value) => value.trim()),
    categoryIds,
  );

  const price = parsePrice(params.get("price"));
  next.priceMin = price.min;
  next.priceMax = price.max;
  next.avail = params.get("avail") === "in-stock";
  next.offers = uniqueValid(
    (params.get("offer") || "").split(",").map((value) => value.trim()),
    new Set(OFFERS),
  );

  const sort = params.get("sort");
  if (SORTS.includes(sort) && sort !== "recommended") {
    next.sort = sort;
    explicitSort = true;
  } else {
    explicitSort = false;
  }

  const page = Number.parseInt(params.get("page") || "1", 10);
  next.page = Number.isFinite(page) && page > 0 ? page : 1;
  return next;
}

function buildURL(forState = state) {
  const params = new URLSearchParams();
  if (forState.q) {
    params.set("q", forState.q);
  }
  if (forState.categories.length) {
    params.set("category", forState.categories.join(","));
  }
  if (forState.priceMin !== null || forState.priceMax !== null) {
    params.set(
      "price",
      `${forState.priceMin ?? ""}-${forState.priceMax ?? ""}`,
    );
  }
  if (forState.avail) {
    params.set("avail", "in-stock");
  }
  if (forState.offers.length) {
    params.set("offer", forState.offers.join(","));
  }
  if (forState.sort !== "recommended") {
    params.set("sort", forState.sort);
  }
  if (forState.page > 1) {
    params.set("page", String(forState.page));
  }
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ""}`;
}

function writeURL(mode) {
  const url = buildURL();
  if (mode === "push") {
    window.history.pushState({}, "", url);
  } else {
    window.history.replaceState({}, "", url);
  }
}

function activeFilterCount() {
  return (
    state.categories.length +
    state.offers.length +
    (state.priceMin !== null || state.priceMax !== null ? 1 : 0) +
    (state.avail ? 1 : 0)
  );
}

function filtersHTML(scope) {
  const categoryRows = categories
    .map(
      (category, index) => `
      <label class="checkbox checkbox--row" for="${scope}-cat-${index}">
        <span class="checkbox__text">${escapeHTML(category.name)}</span>
        <span class="checkbox__count">${category.productCount}</span>
        <input type="checkbox" id="${scope}-cat-${index}" value="${escapeHTML(category.id)}" data-filter="category">
      </label>`,
    )
    .join("");

  const priceRows = [
    `<label class="radio-row" for="${scope}-price-any">
      <input type="radio" id="${scope}-price-any" name="${scope}-price" value="any" data-filter="price-preset" checked>
      <span>Any price</span>
    </label>`,
    ...PRICE_PRESETS.map(
      (preset, index) => `
      <label class="radio-row" for="${scope}-price-${index}">
        <input type="radio" id="${scope}-price-${index}" name="${scope}-price" value="${preset.value}" data-filter="price-preset">
        <span>${preset.label}</span>
      </label>`,
    ),
  ].join("");

  const offerRows = OFFERS.map(
    (offer, index) => `
      <label class="checkbox checkbox--row" for="${scope}-offer-${index}">
        <span class="checkbox__text">${OFFER_LABELS[offer]}</span>
        <input type="checkbox" id="${scope}-offer-${index}" value="${offer}" data-filter="offer">
      </label>`,
  ).join("");

  return `
    <fieldset class="filter-group">
      <legend>Category</legend>
      <div class="filter-list">${categoryRows}</div>
    </fieldset>
    <fieldset class="filter-group">
      <legend>Price</legend>
      <div class="price-presets">${priceRows}</div>
      <div class="price-custom">
        <div class="field">
          <label class="field-label" for="${scope}-price-min">Min KSh</label>
          <input class="input" type="number" inputmode="numeric" min="0" step="100" id="${scope}-price-min" data-filter="price-min" placeholder="0">
        </div>
        <div class="field">
          <label class="field-label" for="${scope}-price-max">Max KSh</label>
          <input class="input" type="number" inputmode="numeric" min="0" step="100" id="${scope}-price-max" data-filter="price-max" placeholder="Any">
        </div>
      </div>
    </fieldset>
    <fieldset class="filter-group">
      <legend>Availability</legend>
      <label class="switch">
        <input type="checkbox" data-filter="avail">
        <span>Hide out of stock</span>
      </label>
    </fieldset>
    <fieldset class="filter-group">
      <legend>Offers</legend>
      <div class="filter-list">${offerRows}</div>
    </fieldset>`;
}

function syncContainer(container, source) {
  if (!container) {
    return;
  }
  for (const input of container.querySelectorAll('[data-filter="category"]')) {
    input.checked = source.categories.includes(input.value);
  }
  for (const input of container.querySelectorAll('[data-filter="offer"]')) {
    input.checked = source.offers.includes(input.value);
  }
  const avail = container.querySelector('[data-filter="avail"]');
  if (avail) {
    avail.checked = source.avail;
  }

  const minInput = container.querySelector('[data-filter="price-min"]');
  const maxInput = container.querySelector('[data-filter="price-max"]');
  const hasCustom =
    source.priceMin !== null || source.priceMax !== null
      ? !PRICE_PRESETS.some(
          (preset) =>
            preset.min === source.priceMin && preset.max === source.priceMax,
        )
      : false;

  let presetValue = "any";
  if (source.priceMin !== null || source.priceMax !== null) {
    const match = PRICE_PRESETS.find(
      (preset) =>
        preset.min === source.priceMin && preset.max === source.priceMax,
    );
    presetValue = match ? match.value : "";
  }

  for (const input of container.querySelectorAll(
    '[data-filter="price-preset"]',
  )) {
    input.checked = input.value === presetValue;
  }

  if (minInput) {
    minInput.value = hasCustom && source.priceMin !== null ? source.priceMin : "";
  }
  if (maxInput) {
    maxInput.value = hasCustom && source.priceMax !== null ? source.priceMax : "";
  }
}

function syncControls(source = state) {
  syncContainer(elements.desktopFilters, source);
  syncContainer(elements.sheetFilters, source);
  if (elements.search) {
    elements.search.value = source.q;
  }
  if (elements.sort) {
    elements.sort.value = source.sort;
  }
  if (elements.filterCount) {
    const count = activeFilterCount();
    elements.filterCount.textContent = String(count);
    elements.filterCount.hidden = count === 0;
  }
}

function readControls(container) {
  const next = {
    categories: [...container.querySelectorAll('[data-filter="category"]')]
      .filter((input) => input.checked)
      .map((input) => input.value),
    offers: [...container.querySelectorAll('[data-filter="offer"]')]
      .filter((input) => input.checked)
      .map((input) => input.value),
    avail: Boolean(container.querySelector('[data-filter="avail"]')?.checked),
    priceMin: null,
    priceMax: null,
  };

  const minInput = container.querySelector('[data-filter="price-min"]');
  const maxInput = container.querySelector('[data-filter="price-max"]');
  const customMin = parseNumber(minInput?.value);
  const customMax = parseNumber(maxInput?.value);

  if (customMin !== null || customMax !== null) {
    next.priceMin = customMin;
    next.priceMax = customMax;
  } else {
    const preset = container.querySelector(
      '[data-filter="price-preset"]:checked',
    );
    if (preset && preset.value !== "any") {
      const parsed = parsePrice(preset.value);
      next.priceMin = parsed.min;
      next.priceMax = parsed.max;
    }
  }
  return next;
}

function applyFilters(filters, mode = "push") {
  state = {...state, ...filters, page: 1};
  syncControls();
  render();
  writeURL(mode);
}

function handleFilterChange(event) {
  const target = event.target;
  const container = target.closest("[data-filters]");
  if (!container) {
    return;
  }

  if (target.matches('[data-filter="price-preset"]')) {
    const minInput = container.querySelector('[data-filter="price-min"]');
    const maxInput = container.querySelector('[data-filter="price-max"]');
    if (minInput) {
      minInput.value = "";
    }
    if (maxInput) {
      maxInput.value = "";
    }
  }

  if (
    target.matches('[data-filter="price-min"], [data-filter="price-max"]')
  ) {
    for (const input of container.querySelectorAll(
      '[data-filter="price-preset"]',
    )) {
      input.checked = false;
    }
  }

  const filters = readControls(container);
  if (isMobile() && elements.sheet?.open) {
    draft = {...draft, ...filters};
    return;
  }
  applyFilters(filters);
}

function searchText(product) {
  return [
    product.model,
    product.name,
    product.categoryName,
    product.tags.join(" "),
    product.sizes.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function scoreProduct(product, words) {
  let score = 0;
  const model = product.model.toLowerCase();
  const name = product.name.toLowerCase();
  const category = product.categoryName.toLowerCase();
  const tags = product.tags.join(" ").toLowerCase();
  const sizes = product.sizes.join(" ").toLowerCase();

  for (const word of words) {
    if (model.includes(word)) {
      score += 12;
    }
    if (name.includes(word)) {
      score += 8;
    }
    if (category.includes(word)) {
      score += 4;
    }
    if (tags.includes(word)) {
      score += 6;
    }
    if (sizes.includes(word)) {
      score += 3;
    }
  }
  return score;
}

function matchesQuery(product, words) {
  if (!words.length) {
    return true;
  }
  const haystack = searchText(product);
  return words.every((word) => haystack.includes(word));
}

function matchesFilters(product) {
  if (
    state.categories.length &&
    !state.categories.includes(product.categoryId)
  ) {
    return false;
  }

  if (state.priceMin !== null || state.priceMax !== null) {
    const inRange = product.variants.some((variant) => {
      if (variant.price <= 0) {
        return false;
      }
      if (state.priceMin !== null && variant.price < state.priceMin) {
        return false;
      }
      if (state.priceMax !== null && variant.price > state.priceMax) {
        return false;
      }
      return true;
    });
    if (!inRange) {
      return false;
    }
  }

  if (state.avail && product.status === "out_of_stock") {
    return false;
  }

  if (state.offers.length) {
    const matchesOffer = state.offers.some((offer) => {
      if (offer === "hot") {
        return product.hot;
      }
      if (offer === "discount") {
        return product.discount;
      }
      if (offer === "tradein") {
        return product.tradein;
      }
      if (offer === "clearance") {
        return product.clearance;
      }
      return false;
    });
    if (!matchesOffer) {
      return false;
    }
  }

  return true;
}

function compareRecommended(a, b, scores) {
  if (state.q) {
    const diff = (scores.get(b.id) || 0) - (scores.get(a.id) || 0);
    if (diff !== 0) {
      return diff;
    }
  }
  if (a.hot !== b.hot) {
    return a.hot ? -1 : 1;
  }
  if (a.categoryOrder !== b.categoryOrder) {
    return a.categoryOrder - b.categoryOrder;
  }
  return a.name.localeCompare(b.name);
}

function sortProducts(list, scores) {
  const sorted = [...list];
  if (state.sort === "price-asc") {
    sorted.sort(
      (a, b) =>
        (a.fromPrice || Number.POSITIVE_INFINITY) -
          (b.fromPrice || Number.POSITIVE_INFINITY) ||
        a.name.localeCompare(b.name),
    );
  } else if (state.sort === "price-desc") {
    sorted.sort(
      (a, b) => (b.fromPrice || 0) - (a.fromPrice || 0) || a.name.localeCompare(b.name),
    );
  } else if (state.sort === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    sorted.sort((a, b) => compareRecommended(a, b, scores));
  }
  return sorted;
}

function filteredProducts() {
  const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  const scores = new Map();
  const list = [];

  for (const product of products) {
    if (!matchesQuery(product, words)) {
      continue;
    }
    if (words.length) {
      scores.set(product.id, scoreProduct(product, words));
    }
    if (matchesFilters(product)) {
      list.push(product);
    }
  }

  return { list: sortProducts(list, scores), scores };
}

function renderSkeletons() {
  if (!elements.results) {
    return;
  }
  elements.results.innerHTML = Array.from(
    { length: 6 },
    () => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-card__media"></div>
        <div class="skeleton-card__body">
          <div class="skeleton-line skeleton-line--short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line--price"></div>
        </div>
      </div>`,
  ).join("");
  if (elements.count) {
    elements.count.textContent = "Loading products…";
  }
}

function chipsHTML() {
  const chips = [];
  for (const id of state.categories) {
    const category = categories.find((entry) => entry.id === id);
    if (category) {
      chips.push(
        chipHTML("category", id, category.name),
      );
    }
  }
  if (state.priceMin !== null || state.priceMax !== null) {
    const preset = PRICE_PRESETS.find(
      (entry) =>
        entry.min === state.priceMin && entry.max === state.priceMax,
    );
    const label = preset
      ? preset.label
      : `${state.priceMin !== null ? formatKSh(state.priceMin) : "Any"} – ${
          state.priceMax !== null ? formatKSh(state.priceMax) : "Any"
        }`;
    chips.push(chipHTML("price", "", label));
  }
  if (state.avail) {
    chips.push(chipHTML("avail", "", "In stock only"));
  }
  for (const offer of state.offers) {
    chips.push(chipHTML("offer", offer, OFFER_LABELS[offer]));
  }

  if (!chips.length) {
    return "";
  }
  return `${chips.join("")}<button class="link-button" type="button" data-clear-all>Clear all</button>`;
}

function chipHTML(kind, value, label) {
  return `<span class="chip">${escapeHTML(label)}<button type="button" aria-label="Remove ${escapeHTML(label)} filter" data-remove="${kind}" data-value="${escapeHTML(value)}">${icon("close")}</button></span>`;
}

function emptyHTML() {
  const text = waLink(
    "Hello Delsi Meat Solutions, I could not find what I need in the catalogue. Could you help me?",
  );
  return `
    <div class="empty-state">
      ${icon("search")}
      <h2>No products match</h2>
      <p>Try a different search or clear some filters. We can also check stock and source items for you.</p>
      <div class="toolbar__row" style="justify-content:center">
        <button class="btn btn--outline" type="button" data-clear-all>Clear filters</button>
        <a class="btn btn--whatsapp" href="${text}" target="_blank" rel="noopener">${icon("whatsapp", "", "icon--filled")}Ask us on WhatsApp</a>
      </div>
    </div>`;
}

function paginationHTML(totalPages) {
  if (totalPages <= 1) {
    return "";
  }
  const page = state.page;
  const parts = [];
  const pageLink = (number, label = String(number), extra = "") =>
    `<li><a href="${escapeHTML(buildURL({ ...state, page: number }))}" data-page="${number}" ${extra}>${label}</a></li>`;

  parts.push(
    page > 1
      ? pageLink(page - 1, `${icon("chevron-left")}<span class="visually-hidden">Previous page</span>`, 'aria-label="Previous page"')
      : `<li><span class="is-disabled" aria-hidden="true">${icon("chevron-left")}</span><span class="visually-hidden">Previous page</span></li>`,
  );

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const numbers = [...pages]
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((a, b) => a - b);

  numbers.forEach((number, index) => {
    if (index > 0 && number - numbers[index - 1] > 1) {
      parts.push('<li><span aria-hidden="true">…</span></li>');
    }
    parts.push(
      number === page
        ? `<li><span aria-current="page">${number}</span></li>`
        : pageLink(number),
    );
  });

  parts.push(
    page < totalPages
      ? pageLink(page + 1, `${icon("chevron-right")}<span class="visually-hidden">Next page</span>`, 'aria-label="Next page"')
      : `<li><span class="is-disabled" aria-hidden="true">${icon("chevron-right")}</span><span class="visually-hidden">Next page</span></li>`,
  );

  return parts.join("");
}

function updateResultCount(total, start, end) {
  if (!elements.count) {
    return;
  }
  if (!total) {
    elements.count.textContent = "No products found";
    return;
  }
  elements.count.textContent = `Showing ${start + 1}–${end} of ${total} products`;
}

function render() {
  if (!loaded || !elements.results) {
    return;
  }

  const { list } = filteredProducts();
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const oldPage = state.page;
  state.page = Math.min(Math.max(1, state.page), totalPages);
  if (state.page !== oldPage) {
    writeURL("replace");
  }

  const start = (state.page - 1) * PER_PAGE;
  const end = Math.min(start + PER_PAGE, total);
  const pageItems = list.slice(start, end);

  if (!total) {
    elements.results.innerHTML = emptyHTML();
  } else {
    elements.results.innerHTML = pageItems
      .map((product, index) =>
        productCardHTML(product, { eager: state.page === 1 && index < 3 }),
      )
      .join("");
  }

  updateResultCount(total, start, end);
  if (elements.chips) {
    elements.chips.innerHTML = chipsHTML();
  }
  if (elements.pagination) {
    elements.pagination.innerHTML = paginationHTML(totalPages);
    elements.pagination.hidden = totalPages <= 1;
  }
  syncControls();
}

function removeFilter(kind, value) {
  const filters = {};
  if (kind === "category") {
    filters.categories = state.categories.filter((id) => id !== value);
  } else if (kind === "offer") {
    filters.offers = state.offers.filter((offer) => offer !== value);
  } else if (kind === "price") {
    filters.priceMin = null;
    filters.priceMax = null;
  } else if (kind === "avail") {
    filters.avail = false;
  }
  state = {...state, ...filters, page: 1};
  syncControls();
  render();
  writeURL("push");
}

function clearAllFilters(mode = "push") {
  state = {
    ...state,
    categories: [],
    priceMin: null,
    priceMax: null,
    avail: false,
    offers: [],
    page: 1,
  };
  syncControls();
  render();
  writeURL(mode);
}

function scrollToResults() {
  if (!elements.resultsHeading) {
    return;
  }
  const behavior =
    document.documentElement.getAttribute("data-motion") === "off"
      ? "auto"
      : "smooth";
  elements.resultsHeading.scrollIntoView({ behavior, block: "start" });
  elements.resultsHeading.focus({ preventScroll: true });
}

function bindEvents() {
  const search = debounce((value) => {
    state = {...state, q: value.trim(), page: 1};
    render();
    writeURL("replace");
  }, 250);

  elements.search?.addEventListener("input", (event) => {
    search(event.target.value);
  });

  elements.sort?.addEventListener("change", (event) => {
    state = {...state, sort: event.target.value, page: 1};
    render();
    writeURL("push");
  });

  document.addEventListener("change", (event) => {
    if (!event.target.matches("[data-filter]")) {
      return;
    }
    if (
      event.target.matches('[data-filter="price-min"], [data-filter="price-max"]')
    ) {
      return;
    }
    handleFilterChange(event);
  });

  const customPrice = debounce((event) => {
    if (isMobile() && elements.sheet?.open) {
      handleFilterChange(event);
      return;
    }
    handleFilterChange(event);
  }, 250);

  document.addEventListener("input", (event) => {
    if (
      event.target.matches('[data-filter="price-min"], [data-filter="price-max"]')
    ) {
      customPrice(event);
    }
  });

  elements.chips?.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      removeFilter(remove.dataset.remove, remove.dataset.value);
      return;
    }
    if (event.target.closest("[data-clear-all]")) {
      clearAllFilters();
    }
  });

  elements.results?.addEventListener("click", (event) => {
    if (event.target.closest("[data-clear-all]")) {
      clearAllFilters();
    }
  });

  elements.pagination?.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-page]");
    if (!link) {
      return;
    }
    event.preventDefault();
    const page = Number.parseInt(link.dataset.page, 10);
    if (!Number.isFinite(page)) {
      return;
    }
    state = {...state, page};
    render();
    writeURL("push");
    scrollToResults();
  });

  elements.filterToggle?.addEventListener("click", () => {
    draft = {
      ...draft,
      categories: [...state.categories],
      priceMin: state.priceMin,
      priceMax: state.priceMax,
      avail: state.avail,
      offers: [...state.offers],
    };
    syncContainer(elements.sheetFilters, draft);
    openDialog(elements.sheet);
  });

  elements.sheet?.addEventListener("click", (event) => {
    if (event.target.closest("[data-apply-filters]")) {
      state = {
        ...state,
        ...readControls(elements.sheetFilters),
        page: 1,
      };
      syncControls();
      render();
      writeURL("push");
      elements.sheet.close();
    }
    if (event.target.closest("[data-clear-sheet]")) {
      draft = {
        ...draft,
        categories: [],
        priceMin: null,
        priceMax: null,
        avail: false,
        offers: [],
      };
      syncContainer(elements.sheetFilters, draft);
    }
  });

  window.addEventListener("popstate", () => {
    if (!loaded) {
      return;
    }
    state = parseState();
    syncControls();
    render();
  });

  const wide = window.matchMedia("(min-width: 1024px)");
  const onWide = (event) => {
    if (event.matches && elements.sheet?.open) {
      elements.sheet.close();
    }
  };
  if (wide.addEventListener) {
    wide.addEventListener("change", onWide);
  } else {
    wide.addListener(onWide);
  }
}

async function init() {
  if (!elements.results) {
    return;
  }
  renderSkeletons();

  try {
    const response = await fetch("products.json");
    if (!response.ok) {
      throw new Error("Could not load products");
    }
    const data = await response.json();
    categories = data.categories;
    products = data.products;
    loaded = true;
  } catch {
    loaded = true;
    products = [];
    categories = [];
  }

  if (elements.desktopFilters) {
    elements.desktopFilters.innerHTML = filtersHTML("desktop");
  }
  if (elements.sheetFilters) {
    elements.sheetFilters.innerHTML = filtersHTML("sheet");
  }

  state = parseState();
  draft = {...state};
  syncControls(state);
  bindEvents();

  if (elements.sheet) {
    watchDialog(elements.sheet);
  }

  render();

  const params = new URLSearchParams(window.location.search);
  if (params.get("focus") === "search" || window.location.hash === "#search") {
    elements.search?.focus();
    params.delete("focus");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }

  if (!products.length) {
    if (elements.count) {
      elements.count.textContent = "Products could not be loaded";
    }
    if (elements.results) {
      elements.results.innerHTML = emptyHTML();
    }
    if (elements.chips) {
      elements.chips.innerHTML = "";
    }
    if (elements.pagination) {
      elements.pagination.hidden = true;
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
