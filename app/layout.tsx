import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/src/components/Providers";
import ErrorBoundary from "@/src/components/ErrorBoundary";

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
  // Provide a CSP header via meta as a baseline (adjust in middleware / headers for production)
  // NOTE: style-src currently allows 'unsafe-inline' because Next.js injects critical CSS.
  // To remove it: precompute hashes or use a nonce + no inline <style>. We already moved inline CSS out of /out.
  other: {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval'", // remove 'unsafe-eval' when not using turbopack dev
      "style-src 'self' 'unsafe-inline'", // replace with hashed styles for strict mode
      "img-src 'self' data: blob:",
      "connect-src 'self' https://firestore.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
      "font-src 'self' data:",
      "frame-src 'self' https://www.payfast.co.za",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          {/* Client-side providers (NextAuth + Firebase) */}
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
