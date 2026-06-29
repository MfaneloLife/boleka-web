import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShellClient from "@/src/components/layout/AppShellClient";
import { slugToLabel, labelToSlug } from "@/lib/search-filters";

// Force dynamic so every request gets fresh data
export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = slugToLabel(slug);

  const title = `Rent ${categoryName} Near You — BOLEKA South Africa`;
  const description = `Browse ${categoryName.toLowerCase()} for rent on BOLEKA. Find ${categoryName.toLowerCase()} available near you in South Africa. Rent from local owners at great daily rates.`;

  return {
    title,
    description,
    keywords: [
      `rent ${categoryName.toLowerCase()} South Africa`,
      `${categoryName.toLowerCase()} for rent`,
      `hire ${categoryName.toLowerCase()} SA`,
      `borrow ${categoryName.toLowerCase()}`,
      `${categoryName.toLowerCase()} rental near me`,
    ],
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_ZA",
      siteName: "BOLEKA",
      url: `https://eboleka.co.za/categories/${slug}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `https://eboleka.co.za/categories/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryName = slugToLabel(slug);

  // Validate the category exists
  const categoryExists = await prisma.item.findFirst({
    where: { category: { equals: categoryName, mode: "insensitive" }, isActive: true, quantity: { gt: 0 } },
    select: { category: true },
  });

  if (!categoryExists) {
    // Check if the slug matches any known category
    const allCategories = await prisma.item.findMany({
      where: { isActive: true, quantity: { gt: 0 } },
      select: { category: true },
      distinct: ["category"],
    });
    const match = allCategories.find(
      (c) => labelToSlug(c.category) === slug || c.category.toLowerCase().replace(/\s+/g, "-") === slug
    );
    if (!match) notFound();
  }

  const items = await prisma.item.findMany({
    where: {
      category: { equals: categoryExists?.category || categoryName, mode: "insensitive" },
      isActive: true,
      quantity: { gt: 0 },
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
      images: { orderBy: { order: "asc" }, take: 1 },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  // JSON-LD ItemList structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Rent ${categoryName} on BOLEKA`,
    description: `Browse ${categoryName.toLowerCase()} available for rent near you in South Africa.`,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://eboleka.co.za/items/${item.id}`,
      name: item.title,
      image: item.images[0]?.url || undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <AppShellClient>
        <div className="min-h-screen bg-gray-50">
          {/* Breadcrumb */}
          <nav className="max-w-7xl mx-auto px-4 pt-4 pb-2 text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="hover:text-orange-600">Home</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">{categoryName}</li>
            </ol>
          </nav>

          <div className="max-w-7xl mx-auto px-4 pb-10">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Rent {categoryName} Near You
              </h1>
              <p className="mt-2 text-gray-600 text-sm max-w-2xl">
                Browse {categoryName.toLowerCase()} available for rent from local owners across South Africa.
                Find great daily rates and rent with confidence on BOLEKA.
              </p>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No {categoryName.toLowerCase()} available right now.</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition"
                >
                  Browse all items
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                      {item.images[0]?.url ? (
                        <img
                          src={item.images[0].url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-800 px-2 py-0.5 rounded-full">
                        R{item.price.toFixed(0)}/day
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {item.user?.name || "Unknown"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShellClient>
    </>
  );
}