import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/src/lib/order-service';
import { FirebaseDbService } from '@/src/lib/firebase-db';
import { OrderStatus } from '@/src/types/order';
import { adminDb } from '@/src/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const body = await request.json();
  const { qrData } = body;

    if (!qrData) {
      return NextResponse.json({ error: 'QR data is required' }, { status: 400 });
    }

    const orderService = new OrderService();

    try {
      // Parse QR data - should contain order ID and timestamp
      const qrDataParsed = JSON.parse(qrData);
  const { orderId, timestamp } = qrDataParsed;

      if (!orderId || !timestamp) {
        return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 });
      }

      // Check if QR code is expired (120 seconds)
      const now = Date.now();
      const qrAge = now - timestamp;
      const maxAge = 120 * 1000; // 120 seconds in milliseconds

      if (qrAge > maxAge) {
        return NextResponse.json({ error: 'QR code has expired' }, { status: 400 });
      }

      // Get the order
      const order = await OrderService.getOrder(orderId);
      
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Derive vendor identity from session -> find user -> businessProfile (if needed) else use email matching fallback
      // For now we match vendor by order.vendorId compared to stored vendorId (user id) or vendorEmail equal to session email.
      // Load user doc by email
      const userSnap = await adminDb.collection('users').where('email','==',session.user.email).limit(1).get();
      const userDoc = userSnap.empty ? null : userSnap.docs[0];
      const sessionUserId = userDoc?.id;
      if (order.vendorId !== sessionUserId && order.vendorEmail !== session.user.email) {
        return NextResponse.json({ error: 'Unauthorized for this order' }, { status: 403 });
      }

      // Check if order is in the correct status for QR scanning
      if (order.status !== OrderStatus.CASH_PAYMENT) {
        return NextResponse.json({ 
          error: 'Order is not awaiting cash payment confirmation' 
        }, { status: 400 });
      }

      // Use transaction: validate again + mark completed + clear QR fields (single-use)
      const updatedOrder = await adminDb.runTransaction(async (tx)=>{
        const ref = adminDb.collection('orders').doc(orderId);
        const snap = await tx.get(ref);
        if (!snap.exists) throw new Error('Order disappeared');
        const current:any = snap.data();
        if (current.status !== OrderStatus.CASH_PAYMENT) throw new Error('Order not in cash payment state');
        if (current.qrCode !== qrData) throw new Error('Mismatched QR payload');
        if (current.qrCodeExpiresAt && current.qrCodeExpiresAt.toDate() < new Date()) throw new Error('QR code expired');
  tx.update(ref, { status: OrderStatus.PAYMENT_RECEIVED, updatedAt: new Date(), qrCode: FieldValue.delete(), qrCodeExpiresAt: FieldValue.delete() });
        // status audit
        const statusRef = adminDb.collection('orderStatusUpdates').doc();
        tx.set(statusRef, { orderId, status: OrderStatus.PAYMENT_RECEIVED, notes: 'QR cash confirmation', updatedBy: sessionUserId || session.user.email, timestamp: new Date() });
        return { id: ref.id, ...current, status: OrderStatus.PAYMENT_RECEIVED };
      });

      // Attempt payout marking: deterministically mark the payment tied to this order as PAID (merchant payout)
      try {
        // 1) Primary: order-based payments
        if (orderId) {
          const paymentRes = await FirebaseDbService.getPaymentByOrderId(orderId);
          if (paymentRes.success && paymentRes.payment && !paymentRes.payment.merchantPaid) {
            await FirebaseDbService.updatePayment(paymentRes.payment.id, {
              merchantPaid: true,
              merchantPayoutDate: new Date(),
              status: 'PAID',
            });
          }
        }
        
        // 2) Optional fallback: if order has a linked requestId in your model (not present here), you could fetch by requestId
        // Leaving a placeholder in case we later add order.requestId
      } catch (e) {
        console.error('Payout marking after QR failed (non-fatal):', e);
      }

      return NextResponse.json({
        success: true,
        orderId: orderId,
        message: 'Payment confirmed successfully',
        order: updatedOrder
      });

    } catch (parseError) {
      // If QR data is not JSON, treat as plain text order ID
      const orderId = qrData.trim();
      
      const order = await OrderService.getOrder(orderId);
      
      if (!order) {
        return NextResponse.json({ error: 'Invalid QR code or order not found' }, { status: 404 });
      }

      // Verify vendor authorization
      // Revalidate vendor identity for plain text order id path
      const userSnap2 = await adminDb.collection('users').where('email','==',session.user.email).limit(1).get();
      const sessionUserId2 = userSnap2.empty ? null : userSnap2.docs[0].id;
      if (order.vendorId !== sessionUserId2 && order.vendorEmail !== session.user.email) {
        return NextResponse.json({ error: 'Unauthorized for this order' }, { status: 403 });
      }

      // Simple order lookup without timestamp validation
      return NextResponse.json({
        success: true,
        orderId: orderId,
        order: order,
        message: 'Order found'
      });
    }

  } catch (error) {
    console.error('QR scan error:', error);
    return NextResponse.json(
      { error: 'Failed to process QR code' },
      { status: 500 }
    );
  }
}