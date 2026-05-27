import type { Metadata, Viewport } from "next";

// Force dynamic rendering to prevent Clerk from failing during static generation
// when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY isn't available at build time
export const dynamic = 'force-dynamic';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/src/components/Providers";
import ErrorBoundary from "@/src/components/ErrorBoundary";
import PWAInit from "@/src/components/PWAInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Boleka - Peer-to-Peer Sharing Platform",
  description: "A platform for sharing and requesting items with dual profiles for clients and businesses",
  applicationName: "Boleka",
  appleWebApp: {
    capable: true,
    title: "Boleka",
    statusBarStyle: "default",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'BOLEKA',
    'msapplication-TileColor': '#f97316',
    'msapplication-TileImage': '/icons/icon-144x144.png',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com https://img.clerk.com",
      "connect-src 'self' https://api.clerk.com https://clerk.staging.com https://*.clerk.com https://boleka-web.vercel.app",
      "font-src 'self' data:",
      "frame-src 'self' https://www.payfast.co.za https://accounts.clerk.com *.clerk.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://www.payfast.co.za"
    ].join('; ')
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#f97316',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BOLEKA" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="theme-color" content="#f97316" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          {/* Client-side providers (Clerk) */}
          <Providers>{children}</Providers>
        </ErrorBoundary>
        {/* PWA service worker registration & install prompt */}
        <PWAInit />
      </body>
    </html>
  );
}
