import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/wallet/banking
 * List all bank accounts for the authenticated user
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("GET_BANK_ACCOUNTS_ERROR", error);
    return NextResponse.json(
      { error: "Failed to fetch bank accounts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet/banking
 * Save a new bank account for the authenticated user
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bankName, accountHolder, accountNumber, branchCode, accountType } =
      body;

    if (!bankName || !accountHolder || !accountNumber || !branchCode) {
      return NextResponse.json(
        { error: "All bank fields are required" },
        { status: 400 }
      );
    }

    const account = await prisma.bankAccount.create({
      data: {
        userId,
        bankName,
        accountHolder,
        accountNumber,
        branchCode,
        accountType: accountType || "savings",
        verified: false,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("CREATE_BANK_ACCOUNT_ERROR", error);
    return NextResponse.json(
      { error: "Failed to save bank account" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wallet/banking?id=xxx
 * Remove a bank account
 */
export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Account id is required" },
        { status: 400 }
      );
    }

    const account = await prisma.bankAccount.findUnique({ where: { id } });
    if (!account) {
      return NextResponse.json(
        { error: "Bank account not found" },
        { status: 404 }
      );
    }

    if (account.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.bankAccount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE_BANK_ACCOUNT_ERROR", error);
    return NextResponse.json(
      { error: "Failed to remove bank account" },
      { status: 500 }
    );
  }
}