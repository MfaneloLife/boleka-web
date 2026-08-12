import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Items — BOLEKA | Rent & Buy Marketplace South Africa",
  description:
    "Search tools, cameras, electronics, party equipment and more to rent or buy near you on BOLEKA, South Africa's peer-to-peer rental and selling marketplace.",
  keywords: [
    "search items South Africa",
    "rent items near me",
    "buy second hand items SA",
    "rent tools",
    "rent cameras",
    "peer to peer marketplace search",
  ],
  openGraph: {
    title: "Search Items — BOLEKA",
    description:
      "Search tools, cameras, electronics, party equipment and more to rent or buy near you on BOLEKA.",
    type: "website",
    locale: "en_ZA",
    siteName: "BOLEKA",
    url: "https://eboleka.co.za/search",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "BOLEKA Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Search Items — BOLEKA",
    description:
      "Search tools, cameras, electronics, party equipment and more to rent or buy near you on BOLEKA.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "https://eboleka.co.za/search",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}