"use client";

import { useState } from 'react';

interface PaymentFormProps {
  requestId: string;
  amount: number;
  itemName: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export default function PaymentForm({
  requestId,
  amount,
  itemName,
  onCancel,
  onSuccess,
}: PaymentFormProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          amount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Payment failed');
      }

      const data = await response.json();
      
      // Redirect to payment URL if provided (e.g., PayFast)
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Details</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Item:</span>
            <span className="font-medium text-gray-900">{itemName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount due:</span>
            <span className="font-bold text-lg text-orange-600">R{amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-1">Payment Breakdown</h4>
        <p className="text-xs text-blue-700">
          <strong>95%</strong> goes to the item owner ({'R' + (amount * 0.95).toFixed(2)})
          <br />
          <strong>5%</strong> platform commission ({'R' + (amount * 0.05).toFixed(2)})
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handlePayment}
          disabled={processing}
          className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
        >
          {processing ? 'Processing...' : `Pay R${amount.toFixed(2)}`}
        </button>
        <button
          onClick={onCancel}
          disabled={processing}
          className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
