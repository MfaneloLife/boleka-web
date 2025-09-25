import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '../../../../src/lib/order-service';
import { FirebaseDbService } from '@/src/lib/firebase-db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    // Extract PayFast parameters
    const paymentData = {
      m_payment_id: params.get('m_payment_id'),
      pf_payment_id: params.get('pf_payment_id'),
      payment_status: params.get('payment_status'),
      item_name: params.get('item_name'),
      item_description: params.get('item_description'),
      amount_gross: params.get('amount_gross'),
      amount_fee: params.get('amount_fee'),
      amount_net: params.get('amount_net'),
      custom_str1: params.get('custom_str1'), // Order ID
      custom_str2: params.get('custom_str2'), // Payer userId (optional)
      custom_str3: params.get('custom_str3'), // Vendor ID (merchant)
      name_first: params.get('name_first'),
      name_last: params.get('name_last'),
      email_address: params.get('email_address'),
      merchant_id: params.get('merchant_id'),
      signature: params.get('signature')
    };

    // Verify PayFast signature (in production)
    if (process.env.NODE_ENV === 'production') {
      const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
      if (!merchantKey) {
        console.error('PayFast merchant key not configured');
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
      }

      // Create signature string
      const signatureString = Object.entries(paymentData)
        .filter(([key, value]) => key !== 'signature' && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
        .join('&');

      // Generate signature
      const expectedSignature = crypto
        .createHash('md5')
        .update(signatureString + '&passphrase=' + encodeURIComponent(merchantKey))
        .digest('hex');

      if (expectedSignature !== paymentData.signature) {
        console.error('Invalid PayFast signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

  const orderId = paymentData.custom_str1 as string | null;
  const paymentStatus = paymentData.payment_status as string | null;

    if (!orderId) {
      console.error('No order ID in PayFast notification');
      return NextResponse.json({ error: 'No order ID' }, { status: 400 });
    }

    // Get the order
    const order = await OrderService.getOrder(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`PayFast notification for order ${orderId}: ${paymentStatus}`);

    // Handle payment status
    switch (paymentStatus) {
      case 'COMPLETE':
        // Compute amounts
        const amount = parseFloat(paymentData.amount_gross || paymentData.amount_net || '0');
        const commission = Math.round(amount * 0.08 * 100) / 100;
        const merchantAmount = Math.round((amount - commission) * 100) / 100;

        // Create or update a Payment record linked to this order
        let paymentDocId: string | null = null;
        try {
          const existing = await FirebaseDbService.getPaymentByOrderId(orderId);
          if (existing.success && existing.payment) {
            paymentDocId = existing.payment.id;
            await FirebaseDbService.updatePayment(existing.payment.id, {
              status: 'COMPLETED',
              transactionId: paymentData.pf_payment_id || paymentData.m_payment_id || 'unknown',
              amount,
              commissionAmount: commission,
              merchantAmount,
              paymentMethod: 'PAYFAST',
              paymentDetails: JSON.stringify(paymentData),
              merchantId: paymentData.custom_str3 || existing.payment.merchantId,
              payerId: paymentData.custom_str2 || existing.payment.payerId,
            });
          } else {
            const createRes = await FirebaseDbService.createPayment({
              orderId,
              amount,
              commissionAmount: commission,
              merchantAmount,
              merchantPaid: false,
              status: 'COMPLETED',
              transactionId: paymentData.pf_payment_id || paymentData.m_payment_id || 'unknown',
              paymentMethod: 'PAYFAST',
              paymentDetails: JSON.stringify(paymentData),
              payerId: (paymentData.custom_str2 as string) || order.userId,
              merchantId: (paymentData.custom_str3 as string) || order.vendorId,
            });
            if (createRes.success && createRes.id) {
              paymentDocId = createRes.id;
            }
          }
        } catch (dbErr) {
          console.error('Error creating/updating Payment record for order:', dbErr);
        }

        // Mark order payment as received, using the payments doc id as paymentId
        await OrderService.markPaymentReceived(
          orderId,
          paymentDocId || (paymentData.pf_payment_id || paymentData.m_payment_id || 'unknown'),
          `PayFast payment ${paymentData.pf_payment_id || paymentData.m_payment_id}`,
          amount,
          order.userId
        );
        break;

      case 'FAILED':
      case 'CANCELLED':
        // Log failed payment but don't cancel order automatically
        // The order will expire based on payment due date
        console.log(`Payment ${paymentStatus.toLowerCase()} for order ${orderId}`);
        break;

      default:
        console.log(`Unknown payment status: ${paymentStatus} for order ${orderId}`);
        break;
    }

    // Return success response to PayFast
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing PayFast notification:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}