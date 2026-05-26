import { NextRequest, NextResponse } from 'next/server';
import { validatePayment } from '@/lib/payfast';
import { updatePayment, markRequestPaid } from '@/lib/neon-db';

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    const data: Record<string, string> = {};
    params.forEach((v, k) => (data[k] = v));

    const validation = await validatePayment(data);
    if (!validation.valid) {
      console.error('Invalid ITN:', validation.message);
      return NextResponse.json({ error: 'Invalid ITN' }, { status: 400 });
    }

    const paymentId = data.custom_str1;
    const requestId = data.custom_str2 || undefined;
    const amount = parseFloat(data.amount_gross || data.amount_net || data.amount || '0');

    if (!paymentId) {
      console.error('Missing paymentId in ITN');
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
    }

    await updatePayment({
      id: paymentId,
      status: 'COMPLETED',
      amount,
    });

    if (requestId) {
      await markRequestPaid(requestId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ITN error:', error);
    return NextResponse.json({ error: 'Failed to process ITN' }, { status: 500 });
  }
}

