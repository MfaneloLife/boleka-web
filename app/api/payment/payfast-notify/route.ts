import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validatePayment } from '@/lib/payfast';

/**
 * POST /api/payment/payfast-notify
 * PayFast ITN (Instant Transaction Notification) webhook handler
 * 
 * Custom fields sent from our payment route:
 *   custom_str1 = Payment ID
 *   custom_str2 = Request ID  
 *   custom_str3 = Payer ID
 * 
 * Flow: User pays via PayFast → PayFast sends ITN → We update Payment status → Update Request status
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log('PayFast ITN received:', {
      payment_status: data['payment_status'],
      pf_payment_id: data['pf_payment_id'],
      custom_str1: data['custom_str1'], // Payment ID
      custom_str2: data['custom_str2'], // Request ID
      amount_gross: data['amount_gross'],
    });

    // Verify the ITN with PayFast
    const verification = await validatePayment(data);
    
    if (!verification.valid) {
      console.error('PayFast ITN verification failed:', verification.message);
      return new NextResponse('OK', { status: 200 }); // Always return OK
    }

    const paymentId = data['custom_str1'];
    const requestId = data['custom_str2'];
    const amountPaid = parseFloat(data['amount_gross'] || '0');
    const pfPaymentId = data['pf_payment_id'] || '';

    if (!paymentId) {
      console.error('PayFast ITN missing payment ID');
      return new NextResponse('OK', { status: 200 });
    }

    // Update the Payment record to COMPLETED
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        amount: amountPaid,
      }
    });

    // Update the Request status to PAID
    if (requestId) {
      await prisma.request.update({
        where: { id: requestId },
        data: {
          status: 'PAID',
          totalPrice: amountPaid,
        }
      });

      // Get the request to find the item
      const requestRecord = await prisma.request.findUnique({
        where: { id: requestId },
        select: { itemId: true },
      });

      // Decrement item quantity
      if (requestRecord?.itemId) {
        try {
          const item = await prisma.item.findUnique({ where: { id: requestRecord.itemId } });
          if (item && item.quantity > 0) {
            await prisma.item.update({
              where: { id: requestRecord.itemId },
              data: { quantity: { decrement: 1 } },
            });
            console.log(`[PayFast ITN] Decremented quantity for item ${requestRecord.itemId}`);
          }
        } catch (err) {
          console.error('[PayFast ITN] Failed to decrement quantity:', err);
        }
      }
    }

    console.log('PayFast ITN processed successfully:', {
      paymentId,
      requestId,
      amountPaid,
      pfPaymentId
    });

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('PAYFAST_ITN_ERROR', error);
    return new NextResponse('OK', { status: 200 });
  }
}
