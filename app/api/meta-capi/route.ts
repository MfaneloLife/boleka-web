import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export const runtime = "nodejs";

const META_GRAPH_VERSION = "v22.0";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, event_id } = body as { email?: string; event_id?: string };

    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      return NextResponse.json(
        { error: "Meta Pixel is not configured" },
        { status: 500 }
      );
    }

    if (!email || !event_id) {
      return NextResponse.json(
        { error: "email and event_id are required" },
        { status: 400 }
      );
    }

    // Meta requires emails to be normalized (lowercase + trimmed) before hashing.
    const hashedEmail = sha256(email.trim().toLowerCase());

    const payload = {
      data: [
        {
          event_name: "CompleteRegistration",
          event_time: Math.floor(Date.now() / 1000),
          event_id,
          action_source: "website",
          event_source_url: request.headers.get("referer") ?? undefined,
          user_data: {
            em: hashedEmail,
          },
        },
      ],
    };

    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Meta CAPI request failed", details: result },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("META_CAPI_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
