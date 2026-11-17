// Builds Assets/icons/sprite.svg from Phosphor Icons (MIT, https://phosphoricons.com).
// Keeps the existing #i-<name> ids so markup and js/ui.js icon() keep working.
// Usage: npm install && npm run icons
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const base = path.join(root, "node_modules/@phosphor-icons/core/assets");

// sprite id -> [weight, phosphor file name]
const MAP = {
  home: ["regular", "house"], grid: ["regular", "squares-four"], info: ["regular", "info"],
  search: ["regular", "magnifying-glass"], sun: ["regular", "sun"], moon: ["regular", "moon"],
  accessibility: ["regular", "person-simple-circle"], menu: ["regular", "list"], close: ["regular", "x"],
  "chevron-left": ["regular", "caret-left"], "chevron-right": ["regular", "caret-right"],
  "chevron-down": ["regular", "caret-down"], "arrow-right": ["regular", "arrow-right"],
  sliders: ["regular", "sliders-horizontal"], "map-pin": ["regular", "map-pin"], phone: ["regular", "phone"],
  clock: ["regular", "clock"], truck: ["regular", "truck"], "shield-check": ["regular", "shield-check"],
  headset: ["regular", "headset"], flame: ["regular", "fire"], plus: ["regular", "plus"],
  minus: ["regular", "minus"], check: ["regular", "check"], share: ["regular", "share-network"],
  link: ["regular", "link"], swap: ["regular", "swap"], storefront: ["regular", "storefront"],
  facebook: ["fill", "facebook-logo"], whatsapp: ["fill", "whatsapp-logo"],
  // category and legacy ids (no meat-machine icons exist in any library: prefer product photos)
  blade: ["regular", "knife"], knife: ["regular", "knife"], cutter: ["regular", "scissors"],
  mincer: ["regular", "funnel"], slicer: ["regular", "knife"], part: ["regular", "gear-six"],
  cog: ["regular", "gear"], snow: ["regular", "snowflake"], cold: ["regular", "thermometer-cold"],
  box: ["regular", "package"], tools: ["regular", "wrench"], bolt: ["regular", "lightning"],
};

const symbols = Object.entries(MAP).map(([id, [weight, name]]) => {
  const file = path.join(base, weight, weight === "fill" ? `${name}-fill.svg` : `${name}.svg`);
  const inner = fs.readFileSync(file, "utf8").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<rect width="256" height="256" fill="none"\/>/, "");
  return `  <symbol id="i-${id}" viewBox="0 0 256 256">${inner}</symbol>`;
});
fs.writeFileSync(path.join(root, "Assets/icons/sprite.svg"), `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join("\n")}\n</svg>\n`);
console.log(`Wrote ${symbols.length} icons`);
