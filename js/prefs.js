const STORAGE_KEY = "delsi-prefs";

const DEFAULTS = {
  theme: "system",
  motion: "system",
  text: "default",
  contrast: "off",
  underline: "off",
};

const VALID = {
  theme: ["system", "light", "dark"],
  motion: ["system", "reduce", "off"],
  text: ["default", "large", "larger"],
  contrast: ["off", "on"],
  underline: ["off", "on"],
};

const darkMedia = window.matchMedia("(prefers-color-scheme: dark)");
const reduceMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

let state = readPrefs();

function readPrefs() {
  const prefs = {...DEFAULTS};
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    for (const key of Object.keys(DEFAULTS)) {
      if (VALID[key].includes(stored[key])) {
        prefs[key] = stored[key];
      }
    }
  } catch {
    return prefs;
  }
  return prefs;
}

function writePrefs() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage can be unavailable in private browsing */
  }
}

export function resolvedTheme(prefs = state) {
  if (prefs.theme === "light" || prefs.theme === "dark") {
    return prefs.theme;
  }
  return darkMedia.matches ? "dark" : "light";
}

function resolvedMotion(prefs = state) {
  if (prefs.motion === "off") {
    return "off";
  }
  if (prefs.motion === "reduce") {
    return "reduce";
  }
  return reduceMedia.matches ? "reduce" : "full";
}

function updateMeta(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0F0F0F" : "#FFFFFF");
  }
}

function syncForm(dialog) {
  if (!dialog) {
    return;
  }
  for (const key of Object.keys(DEFAULTS)) {
    const input = dialog.querySelector(
      `input[name="${key}"][value="${state[key]}"]`,
    );
    if (input) {
      input.checked = true;
    }
  }
}

function updateThemeButtons(theme) {
  for (const button of document.querySelectorAll("[data-theme-toggle]")) {
    const next = theme === "dark" ? "light" : "dark";
    button.setAttribute("aria-label", `Switch to ${next} theme`);
    button.setAttribute("title", `Switch to ${next} theme`);
  }
}

export function applyPrefs() {
  const root = document.documentElement;
  const theme = resolvedTheme();
  const motion = resolvedMotion();

  root.setAttribute("data-theme", theme);
  root.setAttribute("data-motion", motion);

  if (state.text === "default") {
    root.removeAttribute("data-text");
  } else {
    root.setAttribute("data-text", state.text);
  }

  if (state.contrast === "on") {
    root.setAttribute("data-contrast", "high");
  } else {
    root.removeAttribute("data-contrast");
  }

  if (state.underline === "on") {
    root.setAttribute("data-underline", "on");
  } else {
    root.removeAttribute("data-underline");
  }

  updateMeta(theme);
  updateThemeButtons(theme);
  syncForm(document.getElementById("prefs-dialog"));
}

export function focusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getClientRects().length > 0);
}

export function trapFocus(container) {
  container.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") {
      return;
    }
    const items = focusableElements(container);
    if (!items.length) {
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

export function watchDialog(dialog, { closeOnBackdrop = true } = {}) {
  if (!dialog) {
    return;
  }
  trapFocus(dialog);
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
  });
  for (const button of dialog.querySelectorAll("[data-close-dialog]")) {
    button.addEventListener("click", () => dialog.close());
  }
  if (closeOnBackdrop) {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) {
        return;
      }
      const rect = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) {
        dialog.close();
      }
    });
  }
}

export function openDialog(dialog) {
  if (!dialog) {
    return;
  }
  if (!dialog.open) {
    dialog.showModal();
    document.body.classList.add("dialog-open");
  }
}

function init() {
  applyPrefs();

  const dialog = document.getElementById("prefs-dialog");
  if (dialog) {
    watchDialog(dialog);
    dialog.addEventListener("change", (event) => {
      const input = event.target;
      if (!input.name || !VALID[input.name]) {
        return;
      }
      if (VALID[input.name].includes(input.value)) {
        state[input.name] = input.value;
        writePrefs();
        applyPrefs();
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target.closest("[data-prefs-reset]")) {
        state = {...DEFAULTS};
        writePrefs();
        applyPrefs();
      }
    });
    for (const button of document.querySelectorAll("[data-open-prefs]")) {
      button.addEventListener("click", () => {
        syncForm(dialog);
        openDialog(dialog);
      });
    }
  }

  for (const button of document.querySelectorAll("[data-theme-toggle]")) {
    button.addEventListener("click", () => {
      state.theme = resolvedTheme() === "dark" ? "light" : "dark";
      writePrefs();
      applyPrefs();
    });
  }

  const onMediaChange = () => {
    if (state.theme === "system" || state.motion === "system") {
      applyPrefs();
    }
  };
  if (darkMedia.addEventListener) {
    darkMedia.addEventListener("change", onMediaChange);
    reduceMedia.addEventListener("change", onMediaChange);
  } else {
    darkMedia.addListener(onMediaChange);
    reduceMedia.addListener(onMediaChange);
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      state = readPrefs();
      applyPrefs();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
