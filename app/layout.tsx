import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/src/components/Providers";
import ErrorBoundary from "@/src/components/ErrorBoundary";
import PWAInit from "@/src/components/PWAInit";
import JsonLdOrganization from "@/src/components/JsonLdOrganization";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eboleka.co.za"),
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
      "script-src 'self'",
      "style-src 'self' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://pub-0bf9994c37384a93b6f02dc5dc60ec44.r2.dev https://img.clerk.com",
      "connect-src 'self' https://api.clerk.com https://*.clerk.com",
      "font-src 'self' data: https://fonts.gstatic.com",
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
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

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
        {metaPixelId && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');
`,
              }}
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element -- Meta Pixel noscript fallback requires a plain <img> */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}>
        {/* JSON-LD structured data for Google Knowledge Graph & rich results */}
        <JsonLdOrganization />
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
