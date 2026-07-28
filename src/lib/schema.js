// Central JSON-LD builders. One canonical business @id ties every page's
// structured data together (Product, Service, FAQ all reference #business).
import { site } from "./shop.js";

const ORIGIN = site.domain.replace(/\/$/, "");
export const BUSINESS_ID = `${ORIGIN}/#business`;
export const ORG_ID = `${ORIGIN}/#organization`;
export const WEBSITE_ID = `${ORIGIN}/#website`;

export const abs = (path = "/") =>
  `${ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;

// LocalBusiness — the anchor node. Emitted once, in the Base layout.
export function localBusiness() {
  return {
    "@context": "https://schema.org",
    "@type": ["Store", "LocalBusiness"],
    "@id": BUSINESS_ID,
    name: site.name,
    legalName: site.legalName,
    description:
      "Metal posters and dye-sublimation metal prints, signage and awards, printed in Dubai and delivered across the UAE.",
    url: abs("/"),
    telephone: site.phoneDisplay,
    email: site.email,
    priceRange: site.priceRange,
    image: abs("/og-cover.jpg"),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.lat,
      longitude: site.geo.lng,
    },
    openingHours: site.openingHours,
    areaServed: { "@type": "Country", name: "United Arab Emirates" },
    ...(site.socials?.length ? { sameAs: site.socials } : {}),
  };
}

export function website() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: abs("/"),
    name: site.name,
    publisher: { "@id": BUSINESS_ID },
    inLanguage: "en-AE",
  };
}

export function breadcrumb(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.path ? { item: abs(it.path) } : {}),
    })),
  };
}

export function faqPage(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function itemList(name, entries) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: entries.length,
    itemListElement: entries.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: abs(e.path),
      name: e.name,
      ...(e.image ? { image: e.image } : {}),
    })),
  };
}

export function serviceSchema(svc) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: svc.h1,
    serviceType: svc.serviceType,
    provider: { "@id": BUSINESS_ID },
    areaServed: { "@type": "Country", name: "United Arab Emirates" },
    description: svc.schemaDescription,
    url: abs(`/${svc.slug}/`),
  };
}

export function productSchema(poster, path, from, sizes = []) {
  // Every design is sold in four sizes at four prices. A single Offer at the
  // "from" price understated the range; AggregateOffer lets Google show
  // "AED 120–650" and stops the listed price contradicting the size picker.
  const prices = sizes.map((s) => Number(s.price)).filter(Number.isFinite);
  const offers = prices.length
    ? {
        "@type": "AggregateOffer",
        priceCurrency: "AED",
        lowPrice: String(Math.min(...prices)),
        highPrice: String(Math.max(...prices)),
        offerCount: prices.length,
        availability: "https://schema.org/InStock",
        url: abs(path),
        seller: { "@id": BUSINESS_ID },
      }
    : {
        "@type": "Offer",
        priceCurrency: "AED",
        price: String(from),
        availability: "https://schema.org/InStock",
        url: abs(path),
        seller: { "@id": BUSINESS_ID },
      };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${poster.title} — Metal Poster`,
    // Absolute, so crawlers can actually fetch it from a relative catalogue path.
    image: String(poster.img).startsWith("/") ? abs(poster.img) : poster.img,
    description: poster.desc,
    category: poster.category,
    brand: { "@type": "Brand", name: site.name },
    offers,
  };
}
