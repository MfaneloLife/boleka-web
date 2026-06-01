import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-0bf9994c37384a93b6f02dc5dc60ec44.r2.dev';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB server-side, client will compress to ~2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function GET() {
  // Diagnostic check — test R2 connectivity
  const missing: string[] = [];
  if (!R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
  if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (!R2_BUCKET_NAME) missing.push("R2_BUCKET_NAME");

  if (missing.length > 0) {
    return NextResponse.json({ ok: false, error: `Missing env vars: ${missing.join(", ")}` }, { status: 500 });
  }

  try {
    const client = getR2Client();
    await client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME }));
    return NextResponse.json({
      ok: true,
      bucket: R2_BUCKET_NAME,
      publicUrl: R2_PUBLIC_URL,
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: "R2 connection failed",
      detail: err?.message || String(err),
      bucket: R2_BUCKET_NAME,
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      const missing = [
        !R2_ACCOUNT_ID && "R2_ACCOUNT_ID",
        !R2_ACCESS_KEY_ID && "R2_ACCESS_KEY_ID",
        !R2_SECRET_ACCESS_KEY && "R2_SECRET_ACCESS_KEY",
        !R2_BUCKET_NAME && "R2_BUCKET_NAME",
      ].filter(Boolean).join(", ");
      return NextResponse.json({ error: `R2 not configured — missing: ${missing}` }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type "${file.type}". Allowed: jpeg, png, webp, gif` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const sanitizedName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const key = `items/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizedName}`;

    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: buffer.length,
    });

    await client.send(command);

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ url: publicUrl, key });
  } catch (error: any) {
    console.error("R2 upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
