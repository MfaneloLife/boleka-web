import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "BOLEKA — Rent & Sell Items in South Africa | Peer-to-Peer Marketplace",
  description:
    "BOLEKA is South Africa's peer-to-peer rental and selling platform. Rent cameras, tools, electronics, party equipment and more near you. List your items for rent or sale.",
  keywords: [
    "rent items South Africa",
    "peer to peer rental",
    "sell items online SA",
    "rent tools",
    "rent cameras",
    "rent electronics",
    "rent party equipment",
    "marketplace South Africa",
    "eboleka",
    "boleka",
  ],
  openGraph: {
    title: "BOLEKA — Rent & Sell Items in South Africa",
    description:
      "Rent cameras, tools, electronics, party equipment and more near you. List your items for rent or sale. South Africa's peer-to-peer marketplace.",
    type: "website",
    locale: "en_ZA",
    siteName: "BOLEKA",
    url: "https://eboleka.co.za",
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
    title: "BOLEKA — Rent & Sell Items in South Africa",
    description:
      "Rent cameras, tools, electronics, party equipment and more near you. South Africa's peer-to-peer marketplace.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "https://eboleka.co.za",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

export default function Home() {
  return <HomeClient />;
}