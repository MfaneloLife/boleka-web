import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { generatePaymentFormData } from '@/lib/payfast';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = params;
    const { amount, itemName } = await req.json();

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || '' },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the request exists and belongs to the user
    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
        requesterId: user.id,
      },
      include: {
        item: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Ensure the amount matches the item price
    if (request.item.price !== amount) {
      return NextResponse.json(
        { error: 'Payment amount does not match item price' },
        { status: 400 }
      );
    }

    // Create a payment record
    const payment = await prisma.payment.create({
      data: {
        amount,
        status: 'PENDING',
        paymentMethod: 'PAYFAST',
        request: {
          connect: {
            id: requestId,
          },
        },
        payer: {
          connect: {
            id: user.id,
          }
        }
      },
    });

    // Generate PayFast form data
    const formData = generatePaymentFormData({
      amount: amount,
      itemName: itemName,
      email: session.user.email || '',
      firstName: session.user.name?.split(' ')[0] || '',
      lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
      customStr1: payment.id, // Use as reference for the payment
    });

    // Set PayFast endpoint URL
    const paymentUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.payfast.co.za/eng/process' 
      : 'https://sandbox.payfast.co.za/eng/process';

    return NextResponse.json({ 
      success: true, 
      paymentUrl, 
      formData 
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
