export const WHATSAPP_NUMBER = "254727990709";
export const PHONE_DISPLAY = "0727 990 709";
export const PHONE_TEL = "+254727990709";

export function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function pageGreeting() {
  const title = document.title.replace(/\s*\|.*$/, "").trim() || "your website";
  return `Hello Delsi Meat Solutions, I would like to know more about ${title}.\n\nPage: ${window.location.href}\n\nMy delivery location:`;
}

export function productGreeting(name, url) {
  return `Hello Delsi Meat Solutions, I would like to enquire about ${name}.\n\nProduct link: ${url}\n\nMy delivery location:`;
}

export function orderMessage({ name, lines, total, url }) {
  const body = lines.join("\n");
  return `Hello Delsi Meat Solutions, I would like to order:\n\n*${name}*\n${body}\n\nEstimated total: KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(total)} (excluding delivery)\nProduct link: ${url}\n\nMy delivery location:`;
}
