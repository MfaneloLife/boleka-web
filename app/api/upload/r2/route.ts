import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "items";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const key = `${folder}/${userId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    const uploadUrl = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "X-Auth-Token": `${R2_ACCESS_KEY_ID}:${R2_SECRET_ACCESS_KEY}`,
        "Content-Type": file.type || "application/octet-stream",
        "Content-Length": String(buffer.length),
      },
      body: buffer,
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Upload failed", detail: text },
        { status: 500 }
      );
    }

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({ url: publicUrl, key });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", detail: error.message },
      { status: 500 }
    );
  }
}
