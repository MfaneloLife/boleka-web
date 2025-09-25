import { NextRequest, NextResponse } from 'next/server';
import { validatePayment } from '@/lib/payfast';
import { FirebaseDbService } from '@/src/lib/firebase-db';

// PayFast ITN endpoint
export async function POST(request: NextRequest) {
	try {
		const bodyText = await request.text();
		const params = new URLSearchParams(bodyText);
		const data: Record<string, string> = {};
		params.forEach((v, k) => (data[k] = v));

		// Validate ITN with signature and PayFast query
		const validation = await validatePayment(data);
		if (!validation.valid) {
			console.error('Invalid ITN:', validation.message);
			return NextResponse.json({ error: 'Invalid ITN' }, { status: 400 });
		}

		const paymentId = data.custom_str1; // we set this when creating the payment
		const requestId = data.custom_str2 || '';
		const merchantId = data.custom_str3 || '';
		const pfPaymentId = data.pf_payment_id || data.m_payment_id || '';
		const amount = parseFloat(data.amount_gross || data.amount_net || data.amount || '0');

		if (!paymentId) {
			console.error('Missing paymentId in ITN');
			return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
		}

		// Compute commission (8%) and merchant amount for safety
		const commission = Math.round(amount * 0.08 * 100) / 100;
		const merchantAmount = Math.round((amount - commission) * 100) / 100;

		// Update payment record as completed (idempotent)
		await FirebaseDbService.updatePayment(paymentId, {
			status: 'COMPLETED',
			transactionId: pfPaymentId,
			amount,
			commissionAmount: commission,
			merchantAmount,
			paymentDetails: JSON.stringify(data),
		});

		// Optionally, mark the related request as paid/advance states here if your workflow requires
		if (requestId) {
			await FirebaseDbService.updateRequest(requestId, {
				paymentStatus: 'completed',
			});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('ITN error:', error);
		return NextResponse.json({ error: 'Failed to process ITN' }, { status: 500 });
	}
}

