import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyITN, calculateSplitPayment } from '@/src/lib/payfast';

/**
 * POST /api/payment/payfast-notify
 * PayFast ITN (Instant Transaction Notification) webhook handler
 * 
 * This is called by PayFast when payment status changes.
 * It updates the order status and records the split payment details.
 * 
 * Flow: User pays via PayFast → PayFast sends ITN → We update order → Vendor gets 95%, Platform gets 5%
 */
export async function POST(request: NextRequest) {
  try {
    // PayFast sends data as form-urlencoded
    const formData = await request.formData();
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Log the ITN for debugging
    console.log('PayFast ITN received:', {
      payment_status: data['payment_status'],
      pf_payment_id: data['pf_payment_id'],
      custom_str1: data['custom_str1'], // Order ID
      amount_gross: data['amount_gross'],
    });

    // Verify the ITN
    const verification = await verifyITN(data);
    
    if (!verification.valid) {
      console.error('PayFast ITN verification failed:', verification.status);
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Extract order details from custom fields
    const orderId = data['custom_str1'];
    const userId = data['custom_str2'];
    const vendorId = data['custom_str3'];
    const amountPaid = parseFloat(data['amount_gross'] || '0');
    const pfPaymentId = data['pf_payment_id'] || '';

    if (!orderId) {
      console.error('PayFast ITN missing order ID');
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    // Calculate split payment amounts
    const split = calculateSplitPayment(amountPaid);

    // Update the booking in the database
    await prisma.booking.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        totalPrice: amountPaid,
        platformCommission: split.platformAmount,
        vendorPayoutAmount: split.vendorAmount,
        commissionPaid: true,
        notes: `PayFast payment: ${pfPaymentId} | Platform (5%): R${split.platformAmount.toFixed(2)} | Vendor (95%): R${split.vendorAmount.toFixed(2)}`
      }
    });

    console.log('PayFast payment processed successfully:', {
      orderId,
      amountPaid,
      platformCommission: split.platformAmount,
      vendorPayout: split.vendorAmount,
      pfPaymentId
    });

    // PayFast expects "OK" response for ITN
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('PAYFAST_ITN_ERROR', error);
    // Always return OK to prevent PayFast from retrying unnecessarily
    return new NextResponse('OK', { status: 200 });
  }
}
