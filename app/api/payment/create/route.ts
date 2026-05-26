import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getRequestById, createPaymentRecord } from '@/lib/neon-db';
import { generatePaymentFormData, type PaymentData } from '@/lib/payfast';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, amount, itemName, itemDescription } = body as {
      requestId?: string;
      amount?: number;
      itemName?: string;
      itemDescription?: string;
    };

    if (!requestId || amount === undefined || !itemName) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId, amount, itemName' },
        { status: 400 }
      );
    }

    const userId = session.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const requestData = await getRequestById(requestId);
    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const payment = await createPaymentRecord({
      requestId,
      amount,
      payerId: user.id,
      method: 'PAYFAST',
    });

    const paymentData: PaymentData = {
      amount,
      itemName,
      itemDescription: itemDescription || `Payment for ${itemName}`,
      firstName: user.name?.split(' ')[0] || 'Customer',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email ?? '',
      customStr1: payment.id,
      customStr2: requestId,
      customStr3: requestData.owner.id,
    };

    const payFastData = generatePaymentFormData(paymentData);

    return NextResponse.json({
      paymentId: payment.id,
      payFastData,
      payFastUrl:
        process.env.NODE_ENV === 'production'
          ? 'https://www.payfast.co.za/eng/process'
          : 'https://sandbox.payfast.co.za/eng/process',
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
