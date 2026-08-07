import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Set this to your real domain before launch — it drives canonical URLs + sitemap.
export default defineConfig({
  site: "https://www.metalposterdubai.com",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/404"),
      // The sitemap shipped bare <loc> entries. lastmod tells Google when to
      // recrawl, and priority separates the pages that convert from the 42
      // product pages that would otherwise all claim equal importance.
      lastmod: new Date(),
      changefreq: "weekly",
      serialize(item) {
        const url = item.url;
        // Match the homepage by path, not by domain string — hardcoding the host
        // here silently demotes the homepage to 0.7 the next time the domain moves.
        if (new URL(url).pathname === "/") return { ...item, priority: 1.0, changefreq: "weekly" };
        if (url.includes("/posters/") && !url.endsWith("/posters/"))
          return { ...item, priority: 0.6, changefreq: "monthly" };
        if (url.endsWith("/posters/")) return { ...item, priority: 0.9 };
        if (url.includes("-metal-posters/")) return { ...item, priority: 0.8 };
        return { ...item, priority: 0.7 };
      },
    }),
  ],
  build: { format: "directory" },
});
