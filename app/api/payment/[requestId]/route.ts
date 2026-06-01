import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generatePaymentFormData } from '@/lib/payfast';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { amount, itemName } = await req.json();
  const requestRecord = await prisma.request.findUnique({
    where: { id: params.requestId },
    include: { item: true },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (requestRecord.requesterId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const item = requestRecord.item;
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        requestId: requestRecord.id,
        payerId: userId,
        amount: Number(amount),
        status: 'PENDING',
        method: 'PAYFAST',
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const formData = generatePaymentFormData({
      amount: Number(amount),
      itemName: itemName || item.title,
      itemDescription: item.description || undefined,
      email: user?.email || userId,
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ').slice(1).join(' ') || '',
      customStr1: payment.id,        // Payment ID
      customStr2: requestRecord.id,  // Request ID (for lookup)
      customStr3: requestRecord.requesterId, // Payer ID
    });

    const paymentUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.payfast.co.za/eng/process'
      : 'https://sandbox.payfast.co.za/eng/process';

    return NextResponse.json({ success: true, paymentUrl, formData, requestId: requestRecord.id });
}
