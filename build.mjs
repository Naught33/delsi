import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(siteRoot, "..", "_source", "products.master.json");
const productDir = path.join(siteRoot, "product");
const siteUrl = "https://YOUR-DOMAIN";
const phoneDisplay = "0727 990 709";
const phoneTel = "+254727990709";
const whatsappNumber = "254727990709";
const facebookUrl = "https://www.facebook.com/share/19hVE5a5hz/";
const mapsUrl =
  "https://www.google.com/maps/search/?api=1&query=53+Park+Ring+Road+Kilimani+Nairobi";

const CATEGORY_DESCRIPTIONS = {
  "band-saw-blades":
    "Replacement band saw blades for butchery and meat processing, available in a range of lengths and widths.",
  "bone-cutters":
    "Heavy-duty bone cutters for butchers, hotels, restaurants and meat processors.",
  "bone-cutter-parts":
    "Replacement parts for Delsi bone cutters, supplied for dependable repairs and long service.",
  "meat-mincers":
    "Commercial meat mincers built for steady throughput in busy kitchens and butcheries.",
  "meat-mincer-parts":
    "Replacement knives and plates for meat mincers, available for several model sizes.",
  "meat-slicers":
    "Commercial meat slicers for delis, restaurants and butcheries.",
  "ice-makers":
    "Ice makers for display, transport and processing, in a range of daily capacities.",
  "cold-room-units":
    "Cold room units for building or upgrading a walk-in chiller, sold as machine only.",
  packaging:
    "Vacuum packaging and sealing equipment that keeps meat fresh and well presented.",
  "processing-equipment-and-accessories":
    "Processing equipment and practical accessories for butchers, kitchens and meat handlers.",
  knives: "Professional butcher knives for everyday cutting, boning and preparation.",
  electrical:
    "Electrical components and spare parts for butchery and meat processing equipment.",
};

const PRODUCT_IMAGES = {
  "easy-bear": ["Assets/products/easybear.png"],
  "shark-tools": ["Assets/products/shark_tools.png"],
  "purple-paper": ["Assets/products/purple_paper.png"],
  "blue-plastic": ["Assets/products/blue-plastic.jpg"],
  starrett: ["Assets/products/starret.png"],
  "bone-cutter": [
    "Assets/products/bone_saw.png",
    "Assets/products/bone_saw_3160mm.png",
    "Assets/products/blades.png",
  ],
  "bone-cutter-bearing": ["Assets/products/bone_cutter_bearing.png"],
  "bone-cutter-upper-wheel-set": ["Assets/products/bone_cutter_upper_wheel_set.png"],
  "bone-cutter-motor": ["Assets/products/bone_saw.png"],
  "bone-cutter-fixed-handle-screw": ["Assets/products/bone_cutter_fixed_handle_screw.jpg"],
  "bone-cutter-plastic-gasket": ["Assets/products/bone_saw.png"],
  "meat-mincer": [
    "Assets/products/mincer_size_32.jpeg",
    "Assets/products/mincer_size_22.jpeg",
    "Assets/products/mincer_ch42.png",
  ],
  "fm-m12-parts": ["Assets/products/mincer_plates.jpeg"],
  "fm-m22-parts": ["Assets/products/mincer_plates.jpeg"],
  "fm-m32-parts": ["Assets/products/mincer_plates.jpeg"],
  "fm-m42-parts": ["Assets/products/mincer_plates.jpeg"],
  "meat-slicer": ["Assets/products/meat_slicer.png"],
  "tube-ice-maker": ["Assets/products/flake_ice_maker.png"],
  "flake-ice-maker": ["Assets/products/flake_ice_maker.png"],
  "cold-room-unit": ["Assets/products/cold_room_unit.png"],
  "vacuum-packaging-machine": ["Assets/products/vacuum_packaging_machine.jpeg"],
  "sealing-machine": ["Assets/products/sealing_machine.png"],
  "ptfe-high-t-cloth": ["Assets/products/ptfe_high_t_cloth.png"],
  "powder-grinder": ["Assets/products/poweder_grider.jpg"],
  "stainless-plate-with-holes": [
    "Assets/products/stainless_steel_tray_with_holes.png",
  ],
  "stainless-plate-without-holes": [
    "Assets/products/stainless_steel_tray_without_holes.png",
  ],
  "cooler-box": ["Assets/products/Cooler-Box.png"],
  "chopping-board": ["Assets/products/stainless_steel_tray_without_holes.png"],
  "meat-tenderizer": ["Assets/products/meat_tenterizer.png"],
  scissors: ["Assets/products/sciscors.png"],
  "s-shaped-hook": ["Assets/products/s-shaped_hooks.png"],
  "boning-knife": ["Assets/products/bone_cutting_knife.png"],
  "normal-knife": ["Assets/products/normal_knife.png"],
  "5cr15mov-knife": ["Assets/products/5cr15mov_knife.png"],
  "7cr17mov-knife": ["Assets/products/7CrI7MoV_knife.jpg"],
  switch: ["Assets/products/switch.jpeg"],
  fuse: ["Assets/products/fuse.png"],
};

const FALLBACK_IMAGE = "Assets/products/bone_saw.png";

const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const slugify = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const money = (value) =>
  new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value);

const price = (value) => `KSh ${money(value)}`;

const waLink = (text) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

const truncate = (value, length = 157) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= length) {
    return text;
  }
  const cut = text.slice(0, length - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : cut.length).trim()}.`;
};

const metaDescriptionFor = (product) => {
  const sizeText =
    product.sizes.length > 1
      ? `Available in ${product.sizes.length} sizes.`
      : product.sizes.length === 1
        ? "One size available."
        : "";
  const stockText =
    product.status === "out_of_stock"
      ? "Enquire about restocking."
      : product.status === "clear"
        ? "Clearance stock available while supplies last."
        : product.status === "small"
          ? "Limited stock available."
          : "Available from stock.";
  return truncate(
    `${product.name} from the ${product.categoryName} range at Delsi Meat Solutions in Nairobi. ${product.description} ${sizeText} ${stockText} Enquire on WhatsApp for the current price and delivery.`,
  );
};

const icon = (name, prefix = "", extra = "") =>
  `<svg class="icon ${extra}" aria-hidden="true"><use href="${prefix}Assets/icons/sprite.svg#i-${name}"></use></svg>`;

const statusBadge = (status, prefix = "") => {
  const map = {
    clear: ["badge--clear", "Clear stock", "check"],
    small: ["badge--small", "Small stock", "info"],
    arriving: ["badge--arriving", "Arriving soon", "clock"],
    out_of_stock: ["badge--out", "Out of stock", "close"],
  };
  const entry = map[status];
  if (!entry) {
    return "";
  }
  return `<span class="badge ${entry[0]}">${icon(entry[2], prefix)}${entry[1]}</span>`;
};

const hotBadge = (product, prefix = "") =>
  product.hot ? `<span class="badge badge--hot">${icon("flame", prefix)}Hot</span>` : "";

const productBadges = (product, prefix = "") => {
  const badges = [
    hotBadge(product, prefix),
    product.discount
      ? `<span class="badge badge--accent">${icon("check", prefix)}Discount</span>`
      : "",
    product.tradein
      ? `<span class="badge badge--gold">${icon("swap", prefix)}Trade-in offer</span>`
      : "",
    product.clearance
      ? `<span class="badge badge--clear">${icon("check", prefix)}Clearance</span>`
      : "",
    statusBadge(product.status, prefix),
  ].filter(Boolean);
  return badges.join("");
};

const cardPrice = (product) => {
  if (product.fromPrice <= 0) {
    return "Free on request";
  }
  return product.fromPrice === product.toPrice
    ? price(product.fromPrice)
    : `From ${price(product.fromPrice)}`;
};

const productCard = (product, prefix = "", eager = false) => {
  const status = statusBadge(product.status, prefix);
  const note =
    product.variantCount > 1
      ? `${product.variantCount} sizes available`
      : product.sizes[0] || "";
  const href = `${prefix}product/${product.slug}.html`;
  return `<a class="product-card" href="${href}">
  <div class="product-card__media">
    <img src="${prefix}${product.image}" alt="${esc(product.name)}" width="800" height="600" loading="${eager ? "eager" : "lazy"}" decoding="async">
    <div class="product-card__badges">${hotBadge(product, prefix)}${statusBadge(product.status, prefix)}</div>
  </div>
  <div class="product-card__body">
    <span class="product-card__cat">${esc(product.categoryName)}</span>
    <h3 class="product-card__name">${esc(product.name)}</h3>
    <p class="product-card__note">${esc(note)}</p>
    <span class="product-card__price">${cardPrice(product)}</span>
    ${status ? `<span class="product-card__status">${status}</span>` : ""}
  </div>
</a>`;
};

const prefsDialog = (prefix = "") => `
<dialog id="prefs-dialog" aria-labelledby="prefs-title">
  <div class="dialog__head">
    <h2 id="prefs-title">Display preferences</h2>
    <button class="icon-btn" type="button" data-close-dialog aria-label="Close preferences">${icon("close", prefix)}</button>
  </div>
  <div class="dialog__body">
    <fieldset class="segmented">
      <legend>Theme</legend>
      <label><input type="radio" name="theme" value="system"><span>System</span></label>
      <label><input type="radio" name="theme" value="light"><span>Light</span></label>
      <label><input type="radio" name="theme" value="dark"><span>Dark</span></label>
    </fieldset>
    <div class="pref-group">
      <h3>Animations</h3>
      <p>Reduce or switch off motion across the site.</p>
      <fieldset class="segmented">
        <legend class="visually-hidden">Animations</legend>
        <label><input type="radio" name="motion" value="system"><span>Follow system</span></label>
        <label><input type="radio" name="motion" value="reduce"><span>Reduce</span></label>
        <label><input type="radio" name="motion" value="off"><span>Off</span></label>
      </fieldset>
    </div>
    <div class="pref-group">
      <h3>Text size</h3>
      <fieldset class="segmented">
        <legend class="visually-hidden">Text size</legend>
        <label><input type="radio" name="text" value="default"><span>Default</span></label>
        <label><input type="radio" name="text" value="large"><span>Large</span></label>
        <label><input type="radio" name="text" value="larger"><span>Larger</span></label>
      </fieldset>
    </div>
    <div class="pref-group">
      <h3>High contrast</h3>
      <fieldset class="segmented">
        <legend class="visually-hidden">High contrast</legend>
        <label><input type="radio" name="contrast" value="off"><span>Off</span></label>
        <label><input type="radio" name="contrast" value="on"><span>On</span></label>
      </fieldset>
    </div>
    <div class="pref-group">
      <h3>Underline links</h3>
      <fieldset class="segmented">
        <legend class="visually-hidden">Underline links</legend>
        <label><input type="radio" name="underline" value="off"><span>Off</span></label>
        <label><input type="radio" name="underline" value="on"><span>On</span></label>
      </fieldset>
    </div>
  </div>
  <div class="dialog__foot">
    <button class="btn btn--outline" type="button" data-prefs-reset>Reset all</button>
    <button class="btn btn--primary" type="button" data-close-dialog>Done</button>
  </div>
</dialog>`;

const fab = (prefix = "") => `
<a class="wa-fab" href="${waLink("Hello Delsi Meat Solutions, I would like to know more about your products.")}" data-wa-page aria-label="Chat with us on WhatsApp" target="_blank" rel="noopener">
  ${icon("whatsapp", prefix, "icon--filled")}
  <span class="wa-fab__tip">Chat with us on WhatsApp</span>
</a>`;

const PREFS_SCRIPT = `<script>(function(){var d=document.documentElement;d.classList.add("js");var p={};try{p=JSON.parse(localStorage.getItem("delsi-prefs")||"{}");}catch(e){}var m=window.matchMedia,dark=m&&m("(prefers-color-scheme: dark)").matches,rm=m&&m("(prefers-reduced-motion: reduce)").matches;var theme=(p.theme==="light"||p.theme==="dark")?p.theme:(dark?"dark":"light");var motion=p.motion==="off"?"off":(p.motion==="reduce"?"reduce":(rm?"reduce":"full"));d.setAttribute("data-theme",theme);d.setAttribute("data-motion",motion);if(p.text==="large"||p.text==="larger"){d.setAttribute("data-text",p.text);}if(p.contrast==="on"){d.setAttribute("data-contrast","high");}if(p.underline==="on"){d.setAttribute("data-underline","on");}var meta=document.querySelector('meta[name="theme-color"]');if(meta){meta.setAttribute("content",theme==="dark"?"#0F0F0F":"#FFFFFF");}})();</script>`;

const header = (prefix = "", current = "") => {
  const links = [
    ["home", "Home", `${prefix}index.html`, "home"],
    ["products", "Products", `${prefix}products.html`, "grid"],
    ["about", "About us", `${prefix}about.html`, "info"],
  ];
  const nav = links
    .map(
      ([key, label, href, iconName]) => `<li><a href="${href}" ${
        current === key ? 'aria-current="page"' : ""
      }>${label}</a></li>`,
    )
    .join("");
  const mobileNav = links
    .map(
      ([key, label, href, iconName]) => `<li><a href="${href}" ${
        current === key ? 'aria-current="page"' : ""
      }>${icon(iconName, prefix)}${label}</a></li>`,
    )
    .join("");
  return `<header class="site-header">
  <div class="container header-inner">
    <a class="logo" href="${prefix}index.html" aria-label="Delsi Meat Solutions home">
      <picture>
        <source srcset="${prefix}Assets/logo-light.webp" type="image/webp">
        <img class="logo-light" src="${prefix}Assets/logo-light.png" alt="Delsi Meat Solutions" width="560" height="239">
      </picture>
      <picture>
        <source srcset="${prefix}Assets/logo-dark.webp" type="image/webp">
        <img class="logo-dark" src="${prefix}Assets/logo-dark.png" alt="" width="560" height="239">
      </picture>
    </a>
    <nav class="header-nav" aria-label="Main">
      <ul>${nav}</ul>
    </nav>
    <div class="header-actions">
      <a class="icon-btn" href="${prefix}products.html?focus=search" aria-label="Search products">${icon("search", prefix)}</a>
      <button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark theme">${icon("moon", prefix)}${icon("sun", prefix, "icon-sun")}</button>
      <button class="icon-btn" type="button" data-open-prefs aria-label="Accessibility and display preferences" aria-haspopup="dialog">${icon("accessibility", prefix)}</button>
      <a class="icon-btn header-call" href="tel:+254727990709" aria-label="Call 0727 990 709">${icon("phone", prefix)}</a>
      <a class="btn btn--whatsapp btn--sm header-wa" href="${waLink("Hello Delsi Meat Solutions, I would like to know more about your products.")}" data-wa-page target="_blank" rel="noopener">${icon("whatsapp", prefix, "icon--filled")}WhatsApp</a>
      <button class="icon-btn icon-btn--menu" type="button" data-menu-toggle aria-controls="mobile-menu" aria-expanded="false" aria-label="Open menu">${icon("menu", prefix, "icon-menu")}${icon("close", prefix, "icon-close")}</button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" hidden>
  <nav aria-label="Mobile">
    <ul>${mobileNav}</ul>
  </nav>
  <a class="btn btn--whatsapp btn--full" href="${waLink("Hello Delsi Meat Solutions, I would like to know more about your products.")}" data-wa-page target="_blank" rel="noopener">${icon("whatsapp", prefix, "icon--filled")}Chat on WhatsApp</a>
</div>`;
};

const footer = (prefix = "", categories = []) => {
  const categoryLinks = categories
    .slice(0, 8)
    .map(
      (category) =>
        `<li><a href="${prefix}products.html?category=${category.id}">${esc(category.name)}</a></li>`,
    )
    .join("");
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <picture>
          <source srcset="${prefix}Assets/logo-dark.webp" type="image/webp">
          <img src="${prefix}Assets/logo-dark.png" alt="Delsi Meat Solutions" width="560" height="239">
        </picture>
        <p>Your trusted Partner in Butchery and Meat Processing Solutions.</p>
      </div>
      <div class="footer-col">
        <h2>Quick links</h2>
        <ul>
          <li><a href="${prefix}index.html">Home</a></li>
          <li><a href="${prefix}products.html">All products</a></li>
          <li><a href="${prefix}about.html">About us</a></li>
          <li><a href="${waLink("Hello Delsi Meat Solutions, I would like to make an enquiry.")}" target="_blank" rel="noopener" data-wa-page>WhatsApp enquiry</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2>Product categories</h2>
        <ul>${categoryLinks}<li><a href="${prefix}products.html">View all products</a></li></ul>
      </div>
      <div class="footer-col">
        <h2>Contact</h2>
        <ul class="footer-contact">
          <li>${icon("phone", prefix)}<a href="tel:${phoneTel}">${phoneDisplay}</a></li>
          <li>${icon("whatsapp", prefix, "icon--filled")}<a href="${waLink("Hello Delsi Meat Solutions, I would like to make an enquiry.")}" target="_blank" rel="noopener" data-wa-page>WhatsApp us</a></li>
          <li>${icon("map-pin", prefix)}<a href="${mapsUrl}" target="_blank" rel="noopener">53 Park Ring Road, Kilimani, Nairobi</a></li>
          <li>${icon("clock", prefix)}<span>Monday to Saturday</span></li>
          <li>${icon("facebook", prefix, "icon--filled")}<a href="${facebookUrl}" target="_blank" rel="noopener">Facebook</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span data-year>${new Date().getFullYear()}</span> Delsi Meat Solutions Ltd. All rights reserved.</p>
      <p>Website by <a href="mailto:thewebdev3333@gmail.com">Thewebdev33</a></p>
    </div>
    <p class="footer-note">Prices are in KSh and exclude delivery. Final prices, stock and delivery costs are confirmed on WhatsApp.</p>
  </div>
</footer>`;
};

function normalizeVariant(variant, product, categoryId) {
  const vid = slugify(variant.vid || variant.size) || "standard";
  const priceValue = Number(variant.price) || 0;
  const status = variant.status || "available";
  return {
    vid,
    size: variant.size ?? null,
    price: priceValue,
    status,
    note: (variant.note || "").trim(),
    available: status !== "out_of_stock",
    preorder: status === "waiting_for_arrival",
    free: priceValue === 0,
    productId: product.id,
    categoryId,
  };
}

function normalize(data) {
  const categories = [];
  const products = [];
  const categoryIds = new Set();
  const productIds = new Set();

  data.categories.forEach((category, categoryIndex) => {
    const categoryId = category.id || slugify(category.category);
    if (categoryIds.has(categoryId)) {
      throw new Error(`Duplicate category slug: ${categoryId}`);
    }
    categoryIds.add(categoryId);
    const categoryProducts = [];

    for (const rawProduct of category.products) {
      const id = rawProduct.id;
      if (!id) {
        throw new Error(`Missing product id for ${rawProduct.model}`);
      }
      if (productIds.has(id)) {
        throw new Error(`Duplicate product slug: ${id}`);
      }
      productIds.add(id);

      const variants = rawProduct.variants.map((variant) =>
        normalizeVariant(variant, rawProduct, categoryId),
      );
      const vids = new Set();
      for (const variant of variants) {
        if (vids.has(variant.vid)) {
          throw new Error(`Duplicate variant id ${variant.vid} in ${id}`);
        }
        vids.add(variant.vid);
      }

      const tags = [...new Set(rawProduct.tags || [])];
      const notes = variants.map((variant) => variant.note.toLowerCase());
      const statuses = variants.map((variant) => variant.status);
      const positivePrices = variants
        .map((variant) => variant.price)
        .filter((value) => value > 0);
      const fromPrice = positivePrices.length ? Math.min(...positivePrices) : 0;
      const toPrice = positivePrices.length ? Math.max(...positivePrices) : 0;
      const hot =
        tags.includes("hot_product") ||
        notes.some((note) => note.includes("hot product"));
      const discount = tags.includes("short_term_discount");
      const tradein = notes.some((note) => /trade[\s-]?in/.test(note));
      const clearance = statuses.includes("clear_inventory");
      const arriving = statuses.includes("waiting_for_arrival");
      const small = statuses.includes("small_inventory");
      const out = statuses.length > 0 && statuses.every((status) => status === "out_of_stock");

      let status = "available";
      if (out) {
        status = "out_of_stock";
      } else if (clearance) {
        status = "clear";
      } else if (arriving && !statuses.includes("available") && !small) {
        status = "arriving";
      } else if (small) {
        status = "small";
      }

      const images = (PRODUCT_IMAGES[id] || [FALLBACK_IMAGE]).filter((file) =>
        fs.existsSync(path.join(siteRoot, file)),
      );
      if (!images.length) {
        throw new Error(`No product image found for ${id}`);
      }
      const image = images[0];
      const sizes = [
        ...new Set(variants.map((variant) => variant.size).filter(Boolean)),
      ];
      const description =
        rawProduct.description ||
        CATEGORY_DESCRIPTIONS[categoryId] ||
        "Quality butchery and meat processing equipment supplied by Delsi Meat Solutions.";

      const product = {
        id,
        slug: id,
        name: rawProduct.model,
        model: rawProduct.model,
        categoryId,
        categoryName: category.category,
        categoryOrder: categoryIndex + 1,
        image,
        images,
        description,
        tags,
        featured: Number(rawProduct.featured) || 0,
        hot,
        discount,
        tradein,
        clearance,
        arriving,
        small,
        inStock: !out,
        status,
        fromPrice,
        toPrice,
        variantCount: variants.length,
        sizes,
        variants,
      };
      products.push(product);
      categoryProducts.push(product);
    }

    categories.push({
      id: categoryId,
      name: category.category,
      productCount: categoryProducts.length,
    });
  });

  return { categories, products };
}

function productPage(product, allProducts, categories) {
  const canonical = `${siteUrl}/product/${product.slug}.html`;
  const imageUrl = `${siteUrl}/${product.image}`;
  const description = metaDescriptionFor(product);
  const genericUrl = canonical;
  const genericText = `Hello Delsi Meat Solutions, I would like to enquire about ${product.name}.\n\nProduct link: ${canonical}\n\nMy delivery location:`;
  const genericWa = waLink(genericText);
  const related = allProducts
    .filter(
      (entry) =>
        entry.categoryId === product.categoryId && entry.id !== product.id,
    )
    .sort((a, b) => Number(b.hot) - Number(a.hot) || a.name.localeCompare(b.name))
    .slice(0, 4);
  const relatedMarkup = related.length
    ? `<section class="related" aria-labelledby="related-title">
      <div class="section-head">
        <h2 id="related-title">More from ${esc(product.categoryName)}</h2>
        <a class="link-arrow" href="../products.html?category=${product.categoryId}">View category ${icon("arrow-right", "../")}</a>
      </div>
      <div class="related-grid">${related.map((entry) => productCard(entry, "../")).join("")}</div>
    </section>`
    : "";

  const distinctPrices = [
    ...new Set(
      product.variants
        .map((variant) => variant.price)
        .filter((value) => value > 0),
    ),
  ].sort((a, b) => a - b);
  let priceMarkup = `<span class="product-price">Free on request</span>`;
  if (distinctPrices.length === 1) {
    priceMarkup = `<span class="product-price">${price(distinctPrices[0])}<small>Price for the selected size</small></span>`;
  } else if (distinctPrices.length > 1) {
    priceMarkup = `<span class="product-price">${price(distinctPrices[0])} to ${price(distinctPrices[distinctPrices.length - 1])}<small>Price range across ${product.variantCount} available sizes</small></span>`;
  }

  const single = product.variants.length === 1;
  const variantRows = product.variants
    .map((variant) => {
      const sizeLabel = variant.size || "One size";
      const note =
        variant.note && variant.note.toLowerCase() !== "hot product"
          ? variant.note
          : "";
      const isOut = variant.status === "out_of_stock";
      const isFree = variant.price <= 0;
      const badge = statusBadge(
        variant.status === "waiting_for_arrival"
          ? "arriving"
          : variant.status === "clear_inventory"
            ? "clear"
            : variant.status === "small_inventory"
              ? "small"
              : isOut
                ? "out_of_stock"
                : "",
        "../",
      );
      const freeBadge = isFree ? `<span class="badge badge--gold">Free on request</span>` : "";
      const askText = `Hello Delsi Meat Solutions, I would like to ask about ${product.name}${variant.size ? ` (${variant.size})` : ""}.\n\nProduct link: ${canonical}\n\nMy delivery location:`;
      const askLink = `<a class="link-button" href="${waLink(askText)}" target="_blank" rel="noopener">${
        isOut ? "Ask about restock" : "Ask us about this item"
      }</a>`;
      const checkbox =
        single || isFree || isOut
          ? ""
          : `<label class="checkbox variant-row__box"><input class="variant-check" type="checkbox" value="${esc(variant.vid)}" aria-label="Select ${esc(sizeLabel)}"><span class="visually-hidden">Select ${esc(sizeLabel)}</span></label>`;
      const stepper =
        isFree || isOut
          ? ""
          : `<div class="stepper">
              <button type="button" data-step="down" aria-label="Decrease quantity for ${esc(sizeLabel)}" ${single ? "" : "disabled"}>${icon("minus", "../")}</button>
              <input class="variant-qty" type="number" inputmode="numeric" min="1" max="99" value="1" aria-label="Quantity for ${esc(sizeLabel)}" ${single ? "" : "disabled"}>
              <button type="button" data-step="up" aria-label="Increase quantity for ${esc(sizeLabel)}" ${single ? "" : "disabled"}>${icon("plus", "../")}</button>
            </div>`;
      return `<div class="variant-row ${single ? "variant-row--single" : "variant-row--selectable"} ${isOut ? "is-out" : ""}" data-variant data-vid="${esc(variant.vid)}" data-size="${esc(sizeLabel)}" data-price="${variant.price}" data-status="${esc(variant.status)}" data-note="${esc(note)}">
        ${checkbox}
        <div class="variant-row__main">
          <div class="variant-row__label"><span>${esc(sizeLabel)}</span>${badge}${freeBadge}</div>
          ${note ? `<div class="variant-row__note">${esc(note)}</div>` : ""}
          ${isOut || isFree ? askLink : ""}
        </div>
        <div class="variant-row__stepper">
          <span class="variant-row__price">${isFree ? "Free on request" : price(variant.price)}</span>
          ${stepper}
        </div>
      </div>`;
    })
    .join("");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [imageUrl],
    category: product.categoryName,
    brand: {
      "@type": "Brand",
      name: "Delsi Meat Solutions",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "KES",
      lowPrice: product.fromPrice || 0,
      highPrice: product.toPrice || product.fromPrice || 0,
      offerCount: product.variantCount,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: canonical,
    },
  };

  const breadcrumbJson = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${siteUrl}/products.html`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.categoryName,
        item: `${siteUrl}/products.html?category=${product.categoryId}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: canonical,
      },
    ],
  };

  const galleryMarkup =
    product.images.length > 1
      ? `
        <div class="product-thumbs">${product.images
          .map(
            (file, index) =>
              `<button type="button" data-thumb data-src="../${file}" aria-label="View image ${index + 1} of ${product.images.length}"${
                index === 0 ? ' aria-current="true"' : ""
              }><img src="../${file}" alt="" width="64" height="48" loading="lazy" decoding="async"></button>`,
          )
          .join("")}</div>`
      : "";

  const safeJson = (value) =>
    JSON.stringify(value).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(product.name)} | Delsi Meat Solutions</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#FFFFFF">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Delsi Meat Solutions">
<meta property="og:title" content="${esc(product.name)} | Delsi Meat Solutions">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:alt" content="${esc(product.name)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(product.name)} | Delsi Meat Solutions">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${imageUrl}">
<link rel="icon" href="../favicon.ico" sizes="any">
<link rel="preload" href="../Assets/fonts/Inter-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../Assets/fonts/Montserrat-var.woff2" as="font" type="font/woff2" crossorigin>
${PREFS_SCRIPT}
<link rel="stylesheet" href="../css/tokens.css">
<link rel="stylesheet" href="../css/base.css">
<link rel="stylesheet" href="../css/components.css">
<link rel="stylesheet" href="../css/pages.css">
<link rel="stylesheet" href="../css/refresh.css">
<script type="application/ld+json">${safeJson(jsonLd)}</script>
<script type="application/ld+json">${safeJson(breadcrumbJson)}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${header("../", "products")}
<main id="main" class="product-page" data-product-page data-product-name="${esc(product.name)}" data-single="${single}">
  <div class="container">
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb">
        <li><a href="../index.html">Home</a></li>
        <li><a href="../products.html">Products</a></li>
        <li><a href="../products.html?category=${product.categoryId}">${esc(product.categoryName)}</a></li>
        <li><span aria-current="page">${esc(product.name)}</span></li>
      </ol>
    </nav>
    <div class="product-layout">
      <div class="product-media">
        <img class="product-media__main" data-product-image src="../${product.image}" alt="${esc(product.name)}" width="800" height="600" fetchpriority="high" decoding="async">${galleryMarkup}
      </div>
      <div class="product-details">
        <a class="product-cat" href="../products.html?category=${product.categoryId}">${esc(product.categoryName)}</a>
        <h1>${esc(product.name)}</h1>
        <div class="product-badges">${productBadges(product, "../")}</div>
        ${priceMarkup}
        <p class="product-description">${esc(product.description)}</p>

        <section class="variant-picker" aria-labelledby="variant-title">
          <div class="variant-picker__head">
            <h2 id="variant-title">${single ? "Quantity" : "Choose sizes and quantities"}</h2>
            ${single ? "" : `<button class="link-button" type="button" data-clear-selection>Clear selection</button>`}
          </div>
          <div class="variant-list">${variantRows}</div>
          <noscript><p class="notice" style="margin-top:16px">${icon("info", "../")}<span>You can still send an enquiry with the WhatsApp button below. JavaScript adds the selected sizes and quantities to the message.</span></p></noscript>
        </section>

        <div class="order-summary" data-order-summary aria-live="polite">
          <h2>Your estimate</h2>
          <div class="summary-lines" data-summary-lines></div>
          <p class="summary-note" data-summary-empty>No sizes selected yet.</p>
          <div class="summary-total"><span>Estimated total</span><strong data-summary-total>KSh 0</strong></div>
          <p class="summary-note">Delivery is excluded. Final prices and availability are confirmed on WhatsApp.</p>
        </div>

        <div class="order-actions">
          <a class="btn btn--whatsapp" data-order-button href="${genericWa}" target="_blank" rel="noopener">${icon("whatsapp", "../", "icon--filled")}Order on WhatsApp</a>
          <button class="btn btn--outline btn--full" type="button" data-share>${icon("share", "../")}Share this product</button>
        </div>
        <p class="text-small muted">WhatsApp not installed? Call <a href="tel:${phoneTel}">${phoneDisplay}</a>.</p>
        <ul class="product-notes">
          <li>Prices are in KSh.</li>
          <li>Totals are estimates and exclude delivery.</li>
          <li>Delivery is charged separately by location.</li>
        </ul>
      </div>
    </div>
    ${relatedMarkup}
  </div>
</main>
<div class="order-bar" data-order-bar hidden>
  <div class="order-bar__info"><span data-order-count>0 items</span><strong data-order-total>KSh 0</strong></div>
  <a class="btn btn--whatsapp btn--sm" data-order-button href="${genericWa}" target="_blank" rel="noopener">${icon("whatsapp", "../", "icon--filled")}WhatsApp</a>
</div>
${footer("../", categories)}
${fab("../")}
${prefsDialog("../")}
<script type="module" src="../js/site.js"></script>
<script type="module" src="../js/product.js"></script>
</body>
</html>
`;
}

function build() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Master data not found: ${sourcePath}`);
  }
  const data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const { categories, products } = normalize(data);

  const publicData = {
    meta: {
      siteName: "Delsi Meat Solutions",
      siteUrl,
      currency: "KSh",
      phone: phoneDisplay,
      phoneTel,
      whatsapp: whatsappNumber,
      address: "53 Park Ring Road, Kilimani, Nairobi",
      openingDays: "Monday to Saturday",
      facebook: facebookUrl,
      shippingNote: "Prices are in KSh and exclude delivery.",
    },
    categories,
    products,
  };

  const publicJson = JSON.stringify(publicData);
  if (publicJson.includes("original_price")) {
    throw new Error("Public product data must never contain original_price");
  }
  fs.writeFileSync(path.join(siteRoot, "products.json"), `${publicJson}\n`);

  const searchIndex = {
    generated: new Date().toISOString(),
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      text: [
        product.name,
        product.categoryName,
        product.tags.join(" "),
        product.sizes.join(" "),
        product.description,
      ]
        .join(" ")
        .toLowerCase(),
    })),
  };
  fs.writeFileSync(
    path.join(siteRoot, "search-index.json"),
    `${JSON.stringify(searchIndex)}\n`,
  );

  fs.rmSync(productDir, { recursive: true, force: true });
  fs.mkdirSync(productDir, { recursive: true });

  for (const product of products) {
    fs.writeFileSync(
      path.join(productDir, `${product.slug}.html`),
      productPage(product, products, categories),
    );
  }

  const sitemap = [
    `${siteUrl}/`,
    `${siteUrl}/products.html`,
    `${siteUrl}/about.html`,
    ...products.map((product) => `${siteUrl}/product/${product.slug}.html`),
  ].join("\n");
  fs.writeFileSync(path.join(siteRoot, "sitemap.txt"), `${sitemap}\n`);

  const robotsPath = path.join(siteRoot, "robots.txt");
  if (fs.existsSync(robotsPath)) {
    const robots = fs
      .readFileSync(robotsPath, "utf8")
      .replace(/^Sitemap:.*$/m, `Sitemap: ${siteUrl}/sitemap.txt`);
    fs.writeFileSync(robotsPath, robots);
  }

  console.log(
    `Built ${products.length} products in ${categories.length} categories.`,
  );
  console.log(`Sitemap, search index and public products.json updated.`);
}

build();
