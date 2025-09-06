'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/Button';

interface PaymentFormProps {
  requestId: string;
  amount: number;
  itemName: string;
  onCancel?: () => void;
}

export default function PaymentForm({ 
  requestId, 
  amount, 
  itemName, 
  onCancel 
}: PaymentFormProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string> | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const handlePay = async () => {
    if (!session?.user?.email) {
      setError('You need to be logged in to make a payment');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/payment/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          itemName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const data = await response.json();
      setFormData(data.formData);
      setPaymentUrl(data.paymentUrl);

      // Auto-submit the form to PayFast
      setTimeout(() => {
        try {
          const form = document.getElementById('payfast-form') as HTMLFormElement;
          if (form) {
            form.submit();
          } else {
            throw new Error('Payment form not found');
          }
        } catch (error) {
          console.error('Form submission error:', error);
          setError('Failed to redirect to payment gateway. Please try again.');
          setIsLoading(false);
        }
      }, 100);
    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Item:</span>
          <span className="font-medium">{itemName}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium">R{amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-600">Payment Method:</span>
          <span className="font-medium">PayFast</span>
        </div>
      </div>
      
      {formData && paymentUrl ? (
        <form id="payfast-form" action={paymentUrl} method="post" className="hidden">
          {Object.entries(formData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <noscript>
            <button type="submit" className="p-2 bg-orange-600 text-white rounded">
              Click here to continue to payment
            </button>
          </noscript>
        </form>
      ) : (
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="secondary"
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handlePay}
            variant="primary"
            isLoading={isLoading}
          >
            Pay Now
          </Button>
        </div>
      )}
    </div>
  );
}
