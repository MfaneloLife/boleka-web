import { NextRequest, NextResponse } from 'next/server';
import { validatePayment } from '@/lib/payfast';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get PayFast ITN data
    const formData = await request.formData();
    const pfData: Record<string, string> = {};
    
    // Convert FormData to plain object
    for (const [key, value] of formData.entries()) {
      pfData[key] = value.toString();
    }
    
    // Log the ITN data
    console.log('PayFast ITN received:', pfData);
    
    // Validate the payment notification
    const validation = await validatePayment(pfData);
    
    if (!validation.valid) {
      console.error(`PayFast validation failed: ${validation.message}`);
      return new Response('Invalid payment notification', { status: 400 });
    }
    
    // Extract payment ID from the merchant reference or custom string
    const paymentId = pfData.m_payment_id || pfData.custom_str1;
    
    if (!paymentId) {
      console.error('Missing payment ID in ITN');
      return new Response('Missing payment details', { status: 400 });
    }
    
    // Get the payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { request: true },
    });
    
    if (!payment) {
      console.error('Payment not found:', paymentId);
      return new Response('Payment not found', { status: 404 });
    }
    
    // Update payment status in database
    await prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status: pfData.payment_status === 'COMPLETE' ? 'COMPLETED' : 
               pfData.payment_status === 'FAILED' ? 'FAILED' : 'PENDING',
        transactionId: pfData.pf_payment_id,
        paymentMethod: 'PAYFAST',
        paymentDetails: JSON.stringify(pfData),
        updatedAt: new Date(),
      },
    });
    
    // If payment is complete, update the request status
    if (pfData.payment_status === 'COMPLETE') {
      await prisma.request.update({
        where: {
          id: payment.requestId,
        },
        data: {
          status: 'paid',
          paymentStatus: 'paid',
          updatedAt: new Date(),
        },
      });
    }
    
    // Return success response
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('PAYMENT_NOTIFICATION_ERROR', error);
    return new Response('Internal server error', { status: 500 });
  }
}
