import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["Googlebot", "Googlebot-Image", "Googlebot-Video", "Googlebot-News"],
        allow: "/",
        disallow: ["/api/*", "/dashboard/*", "/auth/*", "/payment/*", "/messages/*", "/requests/*"],
      },
      // OpenAI ChatGPT crawler
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/*", "/dashboard/*", "/auth/*", "/payment/*", "/messages/*", "/requests/*"],
      },
      // Google Extended (Bard/Gemini)
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/*", "/dashboard/*", "/auth/*", "/payment/*", "/messages/*", "/requests/*"],
      },
      // Anthropic Claude crawler
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: ["/api/*", "/dashboard/*", "/auth/*", "/payment/*", "/messages/*", "/requests/*"],
      },
      // Common Crawl / CCBot
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/api/*", "/dashboard/*", "/auth/*", "/payment/*", "/messages/*", "/requests/*"],
      },
      // Bing / Microsoft
      {
        userAgent: "bingbot",
        allow: "/",
        disallow: ["/api/*", "/dashboard/*", "/auth/*", "/payment/*", "/messages/*", "/requests/*"],
      },
      // Catch-all for other crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/*", "/dashboard/*", "/auth/*", "/payment/*", "/messages/*", "/requests/*"],
      },
    ],
    sitemap: "https://eboleka.co.za/sitemap.xml",
  };
}