import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { FirebaseDbService } from '@/src/lib/firebase-db';
import { generatePaymentFormData, type PaymentData } from '@/lib/payfast';

export async function POST(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { requestId, amount, itemName, itemDescription } = body;

    // Validate required fields
    if (!requestId || !amount || !itemName) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId, amount, itemName' },
        { status: 400 }
      );
    }

    // Get user from Firebase
    const userResult = await FirebaseDbService.getUserByEmail(session.user.email);
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the request details to find the merchant
    const requestQuery = await FirebaseDbService.getRequestById(requestId);
    if (!requestQuery.success || !requestQuery.request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = requestQuery.request;

    // Calculate commission and merchant amounts
    const commissionRate = 0.08; // 8% commission
    const commissionAmount = Math.round(amount * commissionRate * 100) / 100;
    const merchantAmount = Math.round((amount - commissionAmount) * 100) / 100;

    // Create payment record in Firebase
    const paymentResult = await FirebaseDbService.createPayment({
      requestId,
      amount,
      commissionAmount,
      merchantAmount,
      merchantPaid: false,
      status: 'PENDING',
      paymentMethod: 'PAYFAST',
      payerId: userResult.user.id,
      merchantId: requestData.ownerId
    });

    if (!paymentResult.success) {
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
    }

    // Prepare PayFast payment data
    const paymentData: PaymentData = {
      amount: amount,
      itemName: itemName,
      itemDescription: itemDescription || `Payment for ${itemName}`,
      firstName: userResult.user.name?.split(' ')[0] || 'Customer',
      lastName: userResult.user.name?.split(' ').slice(1).join(' ') || '',
      email: userResult.user.email,
      customStr1: paymentResult.id, // Payment ID for tracking
      customStr2: requestId, // Request ID
      customStr3: requestData.ownerId, // Merchant ID
    };

    // Generate PayFast form data with signature
    const payFastData = generatePaymentFormData(paymentData);

    return NextResponse.json({
      paymentId: paymentResult.id,
      payFastData,
      payFastUrl: process.env.NODE_ENV === 'production' 
        ? 'https://www.payfast.co.za/eng/process'
        : 'https://sandbox.payfast.co.za/eng/process'
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
