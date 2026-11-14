import { productCardHTML, icon } from "./ui.js";

async function initCarousel() {
  const track = document.querySelector("[data-carousel-track]");
  if (!track) {
    return;
  }

  const prev = document.querySelector("[data-carousel-prev]");
  const next = document.querySelector("[data-carousel-next]");
  const message = document.querySelector("[data-carousel-message]");

  let products = [];
  try {
    const response = await fetch("products.json");
    if (!response.ok) {
      throw new Error("Could not load products");
    }
    const data = await response.json();
    products = data.products
      .filter((product) => product.featured)
      .sort((a, b) => a.featured - b.featured);
    for (const item of document.querySelectorAll("[data-category-count]")) {
      const category = data.categories.find(
        (entry) => entry.id === item.dataset.categoryCount,
      );
      if (category) {
        item.textContent = `${category.productCount} ${
          category.productCount === 1 ? "product" : "products"
        }`;
      }
    }
  } catch {
    if (message) {
      message.hidden = false;
    }
    track.hidden = true;
    if (prev) {
      prev.disabled = true;
    }
    if (next) {
      next.disabled = true;
    }
    return;
  }

  if (!products.length) {
    if (message) {
      message.hidden = false;
    }
    return;
  }

  const total = products.length + 1;
  const slides = products.map(
    (product, index) => `
      <div class="carousel__slide" role="group" aria-roledescription="slide" aria-label="${index + 1} of ${total}">
        ${productCardHTML(product, { eager: index < 2 })}
      </div>`,
  );
  slides.push(`
    <div class="carousel__slide" role="group" aria-roledescription="slide" aria-label="${total} of ${total}">
      <a class="product-card product-card--cta" href="products.html">
        ${icon("grid")}
        <strong>See all products</strong>
        <span class="muted text-small">Browse the full catalogue</span>
        <span class="link-arrow">Open catalogue ${icon("arrow-right")}</span>
      </a>
    </div>`);

  track.innerHTML = slides.join("");
  track.hidden = false;

  const step = () => {
    const slide = track.querySelector(".carousel__slide");
    if (!slide) {
      return track.clientWidth;
    }
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 16;
    return slide.getBoundingClientRect().width + gap;
  };

  const updateButtons = () => {
    const max = track.scrollWidth - track.clientWidth;
    if (prev) {
      prev.disabled = track.scrollLeft <= 8;
    }
    if (next) {
      next.disabled = track.scrollLeft >= max - 8;
    }
  };

  prev?.addEventListener("click", () => {
    track.scrollBy({ left: -step(), behavior: "smooth" });
  });
  next?.addEventListener("click", () => {
    track.scrollBy({ left: step(), behavior: "smooth" });
  });

  track.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons, { passive: true });

  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      track.scrollBy({ left: step(), behavior: "smooth" });
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      track.scrollBy({ left: -step(), behavior: "smooth" });
    }
  });

  updateButtons();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCarousel);
} else {
  initCarousel();
}
