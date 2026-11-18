import { showToast, copyText } from "./site.js";
import { waLink, orderMessage, productGreeting } from "./whatsapp.js";
import { openDialog, watchDialog } from "./prefs.js";

const root = document.querySelector("[data-product-page]");
if (root) {
  const productName = root.dataset.productName || document.title;
  const isSingle = root.dataset.single === "true";
  const rows = [...document.querySelectorAll("[data-variant]")];
  const orderButtons = [...document.querySelectorAll("[data-order-button]")];
  const clearButton = document.querySelector("[data-clear-selection]");
  const shareButton = document.querySelector("[data-share]");
  const summaryLines = document.querySelector("[data-summary-lines]");
  const summaryEmpty = document.querySelector("[data-summary-empty]");
  const summaryTotal = document.querySelector("[data-summary-total]");
  const summary = document.querySelector("[data-order-summary]");
  const orderBar = document.querySelector("[data-order-bar]");
  const orderBarCount = document.querySelector("[data-order-count]");
  const orderBarTotal = document.querySelector("[data-order-total]");
  const mainImage = document.querySelector("[data-product-image]");
  const thumbButtons = [...document.querySelectorAll("[data-thumb]")];
  const shareDialog = document.getElementById("share-dialog");
  const shareLink = document.querySelector("[data-share-link]");
  const shareWhatsapp = document.querySelector("[data-share-whatsapp]");
  let orderNudgeTimer;
  let orderNudgeShown = false;
  let hasUserSelection = false;

  for (const thumb of thumbButtons) {
    thumb.addEventListener("click", () => {
      if (!mainImage || !thumb.dataset.src) {
        return;
      }
      mainImage.src = thumb.dataset.src;
      for (const item of thumbButtons) {
        item.setAttribute(
          "aria-current",
          String(item === thumb),
        );
      }
    });
  }

  const format = (value) =>
    `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;

  function rowData(row) {
    const quantityInput = row.querySelector(".variant-qty");
    return {
      vid: row.dataset.vid,
      size: row.dataset.size || "Standard",
      price: Number(row.dataset.price) || 0,
      status: row.dataset.status || "available",
      note: row.dataset.note || "",
      checkbox: row.querySelector(".variant-check"),
      quantity: quantityInput,
      row,
    };
  }

  function isSelected(data) {
    if (data.price <= 0 || data.status === "out_of_stock") {
      return false;
    }
    if (isSingle) {
      return true;
    }
    return Boolean(data.checkbox?.checked);
  }

  function setRowEnabled(data, enabled) {
    if (data.quantity) {
      data.quantity.disabled = !enabled;
    }
    for (const button of data.row.querySelectorAll("[data-step]")) {
      button.disabled = !enabled;
    }
    data.row.classList.toggle("is-selected", enabled);
  }

  function syncRow(data) {
    if (isSingle) {
      setRowEnabled(data, data.price > 0 && data.status !== "out_of_stock");
      return;
    }
    if (!data.checkbox) {
      return;
    }
    const checked = data.checkbox.checked;
    if (checked && data.quantity) {
      data.quantity.value = "1";
    }
    if (!checked && data.quantity) {
      data.quantity.value = "1";
    }
    setRowEnabled(data, checked);
  }

  function clearOrderNudge() {
    window.clearTimeout(orderNudgeTimer);
    for (const button of orderButtons) {
      button.classList.remove("is-highlighted");
    }
  }

  function scheduleOrderNudge() {
    if (orderNudgeShown) {
      return;
    }
    window.clearTimeout(orderNudgeTimer);
    orderNudgeTimer = window.setTimeout(() => {
      orderNudgeShown = true;
      for (const button of orderButtons) {
        button.classList.add("is-highlighted");
      }
    }, 45000);
  }

  function selections() {
    const result = [];
    for (const data of rows.map(rowData)) {
      if (!isSelected(data)) {
        continue;
      }
      const quantity = Math.min(
        99,
        Math.max(1, Number.parseInt(data.quantity?.value || "1", 10) || 1),
      );
      result.push({ ...data, quantity });
    }
    return result;
  }

  function update() {
    const chosen = selections();
    const total = chosen.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const count = chosen.reduce((sum, item) => sum + item.quantity, 0);

    if (summaryLines) {
      summaryLines.innerHTML = "";
      for (const item of chosen) {
        const line = document.createElement("div");
        line.className = "summary-line";
        const label = document.createElement("span");
        label.textContent = `${item.size} × ${item.quantity}${
          item.status === "waiting_for_arrival" ? " (pre-order)" : ""
        }`;
        const value = document.createElement("span");
        value.textContent = format(item.price * item.quantity);
        line.append(label, value);
        summaryLines.append(line);
      }
    }
    if (summaryEmpty) {
      summaryEmpty.hidden = chosen.length > 0;
      summaryLines.hidden = chosen.length === 0;
    }
    if (summaryTotal) {
      summaryTotal.textContent = format(total);
    }

    if (orderBar) {
      orderBar.hidden = chosen.length === 0;
      document.body.classList.toggle("order-bar-active", chosen.length > 0);
      if (orderBarCount) {
        orderBarCount.textContent = `${count} item${count === 1 ? "" : "s"}`;
      }
      if (orderBarTotal) {
        orderBarTotal.textContent = format(total);
      }
    }

    const base = `${window.location.origin}${window.location.pathname}`;
    const sel = chosen
      .map((item) => `${encodeURIComponent(item.vid)}:${item.quantity}`)
      .join(",");
    const url = sel ? `${base}?sel=${encodeURIComponent(sel).replaceAll("%3A", ":").replaceAll("%2C", ",")}` : base;

    const href = chosen.length
      ? waLink(
          orderMessage({
            name: productName,
            lines: chosen.map(
              (item) =>
                `- ${item.size}${item.status === "waiting_for_arrival" ? " (pre-order)" : ""} x ${item.quantity} @ ${format(item.price)} = ${format(item.price * item.quantity)}`,
            ),
            total,
            url,
          }),
        )
      : waLink(productGreeting(productName, base));
    for (const button of orderButtons) {
      button.href = href;
    }

    if (chosen.length && hasUserSelection) {
      scheduleOrderNudge();
    } else {
      clearOrderNudge();
    }

    window.history.replaceState({}, "", sel ? `${base}?sel=${sel}` : base);

    if (shareButton) {
      shareButton.dataset.shareUrl = url;
    }
  }

  function restoreSelection() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("sel");
    if (!raw) {
      if (isSingle) {
        update();
      }
      return;
    }
    const map = new Map();
    for (const part of raw.split(",")) {
      const [vid, qty] = part.split(":");
      if (vid) {
        let key = vid;
        try {
          key = decodeURIComponent(vid);
        } catch {
          key = vid;
        }
        map.set(key, Number.parseInt(qty, 10) || 1);
      }
    }
    for (const data of rows.map(rowData)) {
      const quantity = map.get(data.vid);
      if (!quantity || data.price <= 0 || data.status === "out_of_stock") {
        continue;
      }
      if (data.checkbox) {
        data.checkbox.checked = true;
      }
      if (data.quantity) {
        data.quantity.value = String(Math.min(99, Math.max(1, quantity)));
      }
      setRowEnabled(data, true);
      hasUserSelection = true;
    }
    update();
  }

  for (const row of rows) {
    const data = rowData(row);
    if (data.checkbox) {
      data.checkbox.addEventListener("change", () => {
        hasUserSelection = true;
        syncRow(data);
        update();
      });
    }
    for (const button of row.querySelectorAll("[data-step]")) {
      button.addEventListener("click", () => {
        if (!data.quantity || data.quantity.disabled) {
          return;
        }
        hasUserSelection = true;
        const step = button.dataset.step === "up" ? 1 : -1;
        const next = Math.min(
          99,
          Math.max(1, (Number.parseInt(data.quantity.value, 10) || 1) + step),
        );
        data.quantity.value = String(next);
        update();
      });
    }
    data.quantity?.addEventListener("change", () => {
      hasUserSelection = true;
      const next = Math.min(
        99,
        Math.max(1, Number.parseInt(data.quantity.value, 10) || 1),
      );
      data.quantity.value = String(next);
      update();
    });
    setRowEnabled(data, Boolean(data.checkbox?.checked) || (isSingle && data.price > 0 && data.status !== "out_of_stock"));
  }

  for (const button of orderButtons) {
    button.addEventListener("click", () => {
      hasUserSelection = false;
      clearOrderNudge();
    });
  }

  clearButton?.addEventListener("click", () => {
    hasUserSelection = false;
    for (const data of rows.map(rowData)) {
      if (data.checkbox) {
        data.checkbox.checked = false;
      }
      if (data.quantity) {
        data.quantity.value = "1";
      }
      setRowEnabled(data, false);
    }
    update();
  });

  watchDialog(shareDialog);

  shareButton?.addEventListener("click", async () => {
    const url = shareButton.dataset.shareUrl || window.location.href;
    if (shareLink) {
      shareLink.value = url;
    }
    if (shareWhatsapp) {
      shareWhatsapp.href = waLink(`${productName} from Delsi Meat Solutions\n\n${url}`);
    }
    const ok = await copyText(url);
    showToast(ok ? "Link copied — share it anywhere" : "Copy the link to share it");
    openDialog(shareDialog);
    shareLink?.focus();
    shareLink?.select();
  });

  document.querySelector("[data-share-copy]")?.addEventListener("click", async () => {
    const url = shareLink?.value || window.location.href;
    const ok = await copyText(url);
    showToast(ok ? "Link copied" : "Could not copy the link");
  });

  if (summary) {
    summary.setAttribute("aria-live", "polite");
  }

  restoreSelection();
}
