import { getListingPrice, SITE_URL, type ListingItem } from "@/lib/listings";

interface HomeJsonLdProps {
  items: ListingItem[];
}

/**
 * Build JSON-LD structured data for the homepage.
 * Emits an ItemList (so Google understands the full catalogue) plus a
 * `Product` node per listing with an `Offer` (price) so Google can surface
 * prices in search results.
 */
function buildListingsJsonLd(items: ListingItem[]) {
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
          name: item.location || "South Africa",
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
 * Markup-only structured data. Rendered in the initial HTML response so
 * search engines and AI crawlers see every active listing with its image,
 * title, price and location — without adding a second visual list.
 */
export default function HomeJsonLd({ items }: HomeJsonLdProps) {
  if (items.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(buildListingsJsonLd(items)),
      }}
    />
  );
}
