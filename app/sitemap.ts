import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

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
  ];

  // Dynamic item pages
  const items = await prisma.item.findMany({
    where: { isActive: true, quantity: { gt: 0 } },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const itemPages: MetadataRoute.Sitemap = items.map((item) => ({
    url: `${baseUrl}/items/${item.id}`,
    lastModified: item.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Category pages — get distinct categories from items
  const categories = await prisma.item.findMany({
    where: { isActive: true, quantity: { gt: 0 } },
    select: { category: true },
    distinct: ["category"],
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/categories/${cat.category.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...itemPages, ...categoryPages];
}