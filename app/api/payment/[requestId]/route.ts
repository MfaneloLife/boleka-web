import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generatePaymentFormData } from '@/lib/payfast';
import { adminDb } from '@/src/lib/firebase-admin';

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

    // Get user from Firebase
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', session.user.email || '')
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify the request exists and belongs to the user
    const requestSnapshot = await adminDb.collection('requests').doc(requestId).get();
    
    if (!requestSnapshot.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = requestSnapshot.data();
    
    if (requestData?.requesterId !== userDoc.id) {
      return NextResponse.json({ error: 'Unauthorized - request does not belong to user' }, { status: 403 });
    }

    // Get the item to verify price
    const itemSnapshot = await adminDb.collection('items').doc(requestData.itemId).get();
    
    if (!itemSnapshot.exists) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const itemData = itemSnapshot.data();

    // Ensure the amount matches the item price
    if (itemData?.price !== amount) {
      return NextResponse.json(
        { error: 'Payment amount does not match item price' },
        { status: 400 }
      );
    }

    // Create a payment record in Firebase
    const paymentRef = await adminDb.collection('payments').add({
      amount,
      status: 'PENDING',
      paymentMethod: 'PAYFAST',
      requestId: requestId,
      payerId: userDoc.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Generate PayFast form data
    const formData = generatePaymentFormData({
      amount: amount,
      itemName: itemName,
      email: session.user.email || '',
      firstName: session.user.name?.split(' ')[0] || '',
      lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
      customStr1: paymentRef.id, // Use as reference for the payment
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
