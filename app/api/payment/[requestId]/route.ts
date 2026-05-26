import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generatePaymentFormData } from '@/lib/payfast';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const session = await auth();
  if (!session?.user?.id || !session.userId) {
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

  if (requestRecord.requesterId !== session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const item = requestRecord.item;
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  if (Number(item.price) !== Number(amount)) {
    return NextResponse.json({ error: 'Payment amount does not match item price' }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      requestId: requestRecord.id,
      payerId: session.userId,
      amount: Number(amount),
      status: 'PENDING',
      method: 'PAYFAST',
    },
  });

  const formData = generatePaymentFormData({
    amount: Number(amount),
    itemName: itemName || item.title,
    email: session.userId,
    firstName: session.name?.split(' ')[0] || '',
    lastName: session.name?.split(' ').slice(1).join(' ') || '',
    customStr1: payment.id,
  });

  const paymentUrl = process.env.NODE_ENV === 'production'
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';

  return NextResponse.json({ success: true, paymentUrl, formData });
}
