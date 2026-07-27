import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const baseUrl = "https://eboleka.co.za";

  // Fetch categories for context
  const categories = await prisma.item.findMany({
    where: { isActive: true, quantity: { gt: 0 } },
    select: { category: true },
    distinct: ["category"],
  });
  const categoryList = categories.map((c) => `- ${c.category}`).join("\n");

  const summary = `# BOLEKA — Peer-to-Peer Rental & Selling Platform

> BOLEKA is a South African marketplace where people rent and sell items to each other. Think of it as "Airbnb for things."

## What BOLEKA Does
- List items for rent or sale
- Browse items available near you
- Request to rent/buy items
- Message owners directly
- Secure payments via PayFast
- QR code-based item handover & return

## Key Features
- Peer-to-peer item rental (daily rates)
- Direct messaging between users
- Favourites & wishlists
- Location-based browsing
- Business profiles for shops
- Rating & review system

## Main Sections
- **Homepage**: ${baseUrl} — Browse featured items, categories, and shops
- **Search**: ${baseUrl}/search — Search all available items
- **Categories**: ${baseUrl}/categories/[category] — Browse by category

## Available Categories
${categoryList || "- No categories available yet"}

## How to Search
Visit ${baseUrl}/search?q=your+search+terms to find items.
Add ?category=slug to filter by category.

## Item Pages
Each item has its own page at ${baseUrl}/items/[itemId] with:
- Full description, price, and images
- Owner information and location
- Request-to-rent button
- Share functionality

## For Sellers / Vendors
- Create a business profile
- List items with images, pricing, and delivery options
- Manage requests via dashboard
- Receive payouts to your bank account

## Contact & Support
- Website: ${baseUrl}
- Email: support@eboleka.co.za
`;

  return new NextResponse(summary, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}