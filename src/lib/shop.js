import data from "../data/posters.json";
import site from "../data/site.json";

export const shop = data;
export { site };

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// SEO-friendly slug, e.g. "dubai-marina-night-metal-poster"
export function posterSlug(p) {
  return `${slugify(p.title)}-metal-poster`;
}

// SEO-friendly category slug, e.g. "space-metal-posters"
export function categorySlug(cat) {
  return `${slugify(cat)}-metal-posters`;
}

export function postersInCategory(cat) {
  return shop.posters.filter((p) => p.category === cat);
}

export function waLink(number, text) {
  const digits = String(number || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

// Default WhatsApp order link used across the site.
export function waOrder(text = "Hi Prints UAE! I'd like to order a metal poster.") {
  return waLink(site.whatsapp, text);
}

export function fromPriceOf(p) {
  return p.fromPrice || data.fromPrice || 120;
}
