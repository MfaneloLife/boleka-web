export default function JsonLdOrganization() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BOLEKA",
    alternateName: "eBoleka",
    url: "https://eboleka.co.za",
    logo: "https://eboleka.co.za/logo.png",
    description:
      "BOLEKA is a South African peer-to-peer rental and selling platform. Rent or buy items near you — tools, cameras, electronics, party equipment, and more.",
    email: "support@eboleka.co.za",
    foundingDate: "2024",
    areaServed: {
      "@type": "Country",
      name: "South Africa",
    },
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@eboleka.co.za",
      availableLanguage: ["English"],
    },
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BOLEKA",
    alternateName: "eBoleka",
    url: "https://eboleka.co.za",
    description:
      "Peer-to-peer rental and selling platform in South Africa. List items for rent or sale, or browse items available near you.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://eboleka.co.za/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
    </>
  );
}