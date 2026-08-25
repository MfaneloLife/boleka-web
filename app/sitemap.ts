import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { labelToSlug } from "@/lib/search-filters";

// This route is rendered on-demand, so the sitemap always reflects the
// latest listings from Neon without a redeploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://eboleka.co.za";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/safety`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    // Dynamic listing pages (active items with stock)
    const items = await prisma.item.findMany({
      where: { isActive: true, quantity: { gt: 0 } },
      select: { id: true, updatedAt: true, category: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });

    const itemPages: MetadataRoute.Sitemap = items.map((item) => ({
      url: `${baseUrl}/items/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Category pages derived automatically from live listings
    const categorySlugs = Array.from(
      new Set(items.map((item) => labelToSlug(item.category)))
    );
    const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
      url: `${baseUrl}/categories/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...categoryPages, ...itemPages];
  } catch (error) {
    console.error("Failed to build dynamic sitemap entries:", error);
    return staticPages;
  }
}