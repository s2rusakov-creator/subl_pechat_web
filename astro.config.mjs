import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Set this to your real domain before launch — it drives canonical URLs + sitemap.
export default defineConfig({
  site: "https://printsuae.com",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/404"),
    }),
  ],
  build: { format: "directory" },
});
