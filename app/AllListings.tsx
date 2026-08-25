import Link from "next/link";
import { getListingPrice, SITE_URL, type PublicListing } from "@/lib/listings";

interface AllListingsProps {
  items: PublicListing[];
}

/**
 * Build JSON-LD structured data for the homepage.
 * Emits an ItemList (so Google understands the full catalogue) plus a
 * `Product` node per listing with an `Offer` (price) so Google can surface
 * prices in search results.
 */
function buildListingsJsonLd(items: PublicListing[]) {
  const itemList = {
    "@type": "ItemList",
    name: "Available items for rent or sale on BOLEKA",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/items/${item.id}`,
      name: item.title,
      image: item.imageUrl || undefined,
    })),
  };

  const products = items.map((item) => {
    const price = getListingPrice(item);

    return {
      "@type": "Product",
      "@id": `${SITE_URL}/items/${item.id}#product`,
      name: item.title,
      description:
        item.description?.slice(0, 300) || `Rent or buy "${item.title}" on BOLEKA.`,
      image: item.imageUrl || `${SITE_URL}/icons/icon-512x512.png`,
      sku: item.id,
      category: item.category,
      brand: { "@type": "Brand", name: "BOLEKA" },
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/items/${item.id}`,
        priceCurrency: "ZAR",
        price: price.value,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/UsedCondition",
        availableAtOrFrom: {
          "@type": "Place",
          name: item.location,
        },
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@graph": [itemList, ...products],
  };
}

/**
 * Server-rendered listing grid. Rendered in the initial HTML response so
 * search engines and AI crawlers see every active listing with its image,
 * title, price and location — not just the client-side shell.
 */
export default function AllListings({ items }: AllListingsProps) {
  if (items.length === 0) return null;

  const jsonLd = buildListingsJsonLd(items);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section
        className="max-w-7xl mx-auto px-4 py-8"
        aria-label="All listings"
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Listings</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} {items.length === 1 ? "item" : "items"} available to
            rent or buy
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item) => {
            const price = getListingPrice(item);

            return (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
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
                    R{price.value.toFixed(0)}
                    {price.isRental ? "/day" : ""}
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {item.location}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
