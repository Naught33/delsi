import { trapFocus } from "./prefs.js";
import { waLink, pageGreeting } from "./whatsapp.js";

let toastTimer;

export function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function initHeader() {
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.getElementById("mobile-menu");
  if (!toggle || !menu) {
    return;
  }

  trapFocus(menu);

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    if (open) {
      const first = menu.querySelector("a, button");
      if (first) {
        first.focus();
      }
    }
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });

  const wide = window.matchMedia("(min-width: 1024px)");
  const closeOnWide = (event) => {
    if (event.matches) {
      setOpen(false);
    }
  };
  if (wide.addEventListener) {
    wide.addEventListener("change", closeOnWide);
  } else {
    wide.addListener(closeOnWide);
  }
}

function initWhatsAppLinks() {
  const text = pageGreeting();
  for (const link of document.querySelectorAll("[data-wa-page]")) {
    link.href = waLink(text);
  }
}

const ENGAGED_KEY = "delsi-wa-engaged";
const NUDGE_KEY = "delsi-wa-nudges";

function sessionRead(key, fallback = "") {
  try {
    return window.sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function sessionWrite(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* storage can be unavailable in private browsing */
  }
}

function initWhatsAppNudge() {
  const fab = document.querySelector("[data-wa-cta]");
  const heroCta = document.querySelector("[data-wa-hero]");
  if ((!fab && !heroCta) || document.documentElement.getAttribute("data-motion") === "off") {
    return;
  }

  const markEngaged = () => sessionWrite(ENGAGED_KEY, "1");
  const isEngaged = () => sessionRead(ENGAGED_KEY) === "1";
  const getNudges = () => Number.parseInt(sessionRead(NUDGE_KEY, "0"), 10) || 0;

  if (/products\.html|\/product\//.test(window.location.pathname)) {
    markEngaged();
  }

  if (fab) {
    fab.addEventListener("click", markEngaged);
  }
  if (heroCta) {
    heroCta.addEventListener("click", markEngaged);
  }
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-wa-page], [data-order-button], [data-share], .product-card")) {
      markEngaged();
      if (fab) {
        fab.classList.remove("is-pulsing");
      }
      if (heroCta) {
        heroCta.classList.remove("is-pulsing");
      }
    }
  });

  const pulse = (target) => {
    if (!target) {
      return;
    }
    target.classList.remove("is-pulsing");
    void target.offsetWidth;
    target.classList.add("is-pulsing");
    window.setTimeout(() => target.classList.remove("is-pulsing"), 4000);
  };

  const remind = () => {
    if (!fab || isEngaged() || getNudges() >= 2) {
      return;
    }
    sessionWrite(NUDGE_KEY, String(getNudges() + 1));
    pulse(fab);
  };

  if (heroCta) {
    window.setTimeout(() => {
      if (!isEngaged()) {
        pulse(heroCta);
      }
    }, 1200);
  }
  window.setTimeout(remind, 30000);
  window.setTimeout(remind, 60000);
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) {
    return;
  }
  const motion = document.documentElement.getAttribute("data-motion");
  if (motion === "off" || motion === "reduce" || !("IntersectionObserver" in window)) {
    for (const item of items) {
      item.classList.add("is-visible");
    }
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  for (const item of items) {
    observer.observe(item);
  }
}

export async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

function initCopyLinks() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-link]");
    if (!button) {
      return;
    }
    event.preventDefault();
    const ok = await copyText(window.location.href);
    showToast(ok ? "Link copied" : "Could not copy the link");
  });
}

function initYear() {
  const year = String(new Date().getFullYear());
  for (const item of document.querySelectorAll("[data-year]")) {
    item.textContent = year;
  }
}

function init() {
  document.documentElement.classList.add("js");
  initHeader();
  initWhatsAppLinks();
  initWhatsAppNudge();
  initReveal();
  initCopyLinks();
  initYear();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
