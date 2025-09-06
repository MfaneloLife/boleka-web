import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';
import { generatePaymentFormData, PaymentData } from '@/lib/payfast';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get payment details from request
    const { requestId, amount, itemName } = await request.json();

    if (!requestId || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment details' },
        { status: 400 }
      );
    }

    // Get the request details
    const requestDetails = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
      include: {
        item: true,
      },
    });

    if (!requestDetails) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Calculate commission (5% of the amount)
    const commissionRate = 0.05;
    const commissionAmount = parseFloat(amount) * commissionRate;
    const merchantAmount = parseFloat(amount) - commissionAmount;
    
    // Create a payment record with commission details
    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        commissionAmount,
        merchantAmount,
        status: 'PENDING',
        requestId,
        payerId: user.id,
      },
    });

    // Generate PayFast form data
    const paymentData: PaymentData = {
      amount: parseFloat(amount),
      itemName: itemName || `Payment for ${requestDetails.item.title}`,
      itemDescription: `Payment for request ${requestId}`,
      email: user.email,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      customStr1: payment.id, // Payment ID for reference
      customStr2: requestId, // Request ID
    };

    const formData = generatePaymentFormData(paymentData);

    return NextResponse.json({
      paymentId: payment.id,
      formData,
      paymentUrl: process.env.PAYFAST_API_URL || 'https://sandbox.payfast.co.za/eng/process',
    });
  } catch (error) {
    console.error('CREATE_PAYMENT_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
