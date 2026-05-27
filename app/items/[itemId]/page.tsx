import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Star } from "lucide-react";
import ItemPageClient from "./ItemPageClient";

// Force dynamic so every request gets fresh data
export const dynamic = "force-dynamic";

interface ItemPageProps {
  params: Promise<{ itemId: string }>;
}

// ──────────────────────────────────────────────
// generateMetadata – dynamic SEO for every item
// ──────────────────────────────────────────────
export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { itemId } = await params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      user: { select: { name: true, city: true, region: true } },
      images: { orderBy: { order: "asc" }, take: 1 },
      reviews: { select: { rating: true } },
    },
  });

  if (!item) return { title: "Item Not Found – BOLEKA" };

  const firstImage = item.images[0]?.url;
  const avgRating =
    item.reviews.length > 0
      ? (item.reviews.reduce((s, r) => s + r.rating, 0) / item.reviews.length).toFixed(1)
      : null;

  const location = [item.user?.city, item.user?.region].filter(Boolean).join(", ");
  const title = `${item.title} – R${item.price}/day | BOLEKA`;
  const description = item.description
    ? item.description.slice(0, 160)
    : `Rent or buy "${item.title}" in ${location || "South Africa"} on BOLEKA.`;

  return {
    title,
    description,
    applicationName: "BOLEKA",
    manifest: "/manifest.json",
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_ZA",
      siteName: "BOLEKA",
      url: `https://boleka.com/items/${itemId}`,
      images: firstImage
        ? [{ url: firstImage, width: 1200, height: 630, alt: item.title }]
        : [{ url: "/icons/icon-512x512.png", width: 512, height: 512, alt: "BOLEKA" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: firstImage ? [firstImage] : ["/icons/icon-512x512.png"],
    },
    alternates: {
      canonical: `https://boleka.com/items/${itemId}`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}

// ──────────────────────────────────────────────
// Server component – renders static SEO + JSON-LD
// ──────────────────────────────────────────────
export default async function ItemPage({ params }: ItemPageProps) {
  const { itemId } = await params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      user: { select: { id: true, name: true, image: true, city: true, region: true } },
      images: { orderBy: { order: "asc" } },
      reviews: { select: { rating: true } },
    },
  });

  if (!item) notFound();

  const images = item.images.map((img) => img.url);
  const firstImage = images[0] || "/icons/icon-512x512.png";
  const avgRating =
    item.reviews.length > 0
      ? (item.reviews.reduce((s, r) => s + r.rating, 0) / item.reviews.length).toFixed(1)
      : null;
  const reviewCount = item.reviews.length;
  const location = [item.user?.city, item.user?.region].filter(Boolean).join(", ");

  // ── JSON-LD Structured Data for Google Rich Results ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.title,
    description: item.description || "",
    image: images.length > 0 ? images : "/icons/icon-512x512.png",
    sku: item.id,
    brand: {
      "@type": "Brand",
      name: "BOLEKA",
    },
    offers: {
      "@type": "Offer",
      url: `https://boleka.com/items/${item.id}`,
      priceCurrency: "ZAR",
      price: item.price,
      availability: item.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "Person",
        name: item.user?.name || "BOLEKA Vendor",
      },
    },
    ...(avgRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      {/* JSON-LD structured data injected into <head> */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <nav className="max-w-7xl mx-auto px-4 pt-4 pb-2 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-orange-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/" className="hover:text-orange-600">Items</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium truncate max-w-[200px]">{item.title}</li>
          </ol>
        </nav>

        <div className="max-w-7xl mx-auto px-4 pb-10">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="md:flex">
              {/* ── Image Gallery ── */}
              <div className="md:w-1/2">
                <div className="relative h-72 sm:h-96 w-full bg-gray-100">
                  {images.length > 0 ? (
                    <Image
                      src={firstImage}
                      alt={item.title}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex overflow-x-auto gap-2 p-3">
                    {images.map((url, i) => (
                      <div
                        key={i}
                        className="w-20 h-20 flex-shrink-0 relative rounded-lg overflow-hidden border-2 border-transparent hover:border-orange-400 transition"
                      >
                        <Image
                          src={url}
                          alt={`${item.title} - image ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Item Details ── */}
              <div className="md:w-1/2 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {item.title}
                    </h1>
                    {/* Rating */}
                    <div className="flex items-center mt-2 gap-1">
                      {avgRating ? (
                        <>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-700">{avgRating}</span>
                          <span className="text-sm text-gray-500">({reviewCount} {reviewCount === 1 ? "review" : "reviews"})</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">No reviews yet</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-orange-600">R{item.price}<span className="text-sm font-normal text-gray-500">/day</span></p>
                  </div>
                </div>

                {/* Owner */}
                <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {item.user?.image ? (
                    <Image
                      src={item.user.image}
                      alt={item.user.name || ""}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-800 font-bold">{item.user?.name?.charAt(0) || "?"}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.user?.name || "Unknown"}</p>
                    {location && <p className="text-xs text-gray-500">{location}</p>}
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                  <p className="mt-2 text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {item.description || "No description provided."}
                  </p>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</p>
                    <p className="mt-1 text-sm text-gray-900">{item.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Condition</p>
                    <p className="mt-1 text-sm text-gray-900">{item.condition}</p>
                  </div>
                  {item.quantity > 1 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity</p>
                      <p className="mt-1 text-sm text-gray-900">{item.quantity} available</p>
                    </div>
                  )}
                  {location && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</p>
                      <p className="mt-1 text-sm text-gray-900">{location}</p>
                    </div>
                  )}
                </div>

                {/* Interactive actions – client component */}
                <ItemPageClient itemId={item.id} ownerId={item.user?.id || ""} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
