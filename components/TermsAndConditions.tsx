'use client';

import { useState } from 'react';
import Button from '@/components/Button';

interface TermsAndConditionsProps {
  onAccept: () => void;
  onCancel: () => void;
  itemName: string;
  returnDate?: string;
}

export default function TermsAndConditions({ 
  onAccept, 
  onCancel, 
  itemName,
  returnDate
}: TermsAndConditionsProps) {
  const [isAgreed, setIsAgreed] = useState(false);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Terms and Conditions</h2>
      
      <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50 max-h-60 overflow-y-auto">
        <h3 className="font-semibold mb-2">Rental Agreement for {itemName}</h3>
        
        <p className="mb-3">
          By accepting these terms, I acknowledge and agree to the following conditions:
        </p>
        
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>
            <span className="font-medium">Responsibility for Loss or Damage:</span> I accept full responsibility for any loss, theft, or damage to the item while it is in my possession, regardless of the cause.
          </li>
          <li>
            <span className="font-medium">Return Obligation:</span> I agree to return the item on time {returnDate ? `by ${returnDate}` : 'by the agreed-upon date'} in the same condition as when I received it.
          </li>
          <li>
            <span className="font-medium">Late Returns:</span> I understand that late returns may result in additional charges or penalties as outlined in the rental agreement.
          </li>
          <li>
            <span className="font-medium">Proper Use:</span> I will use the item only for its intended purpose and in accordance with any provided instructions.
          </li>
          <li>
            <span className="font-medium">No Transfer:</span> I will not sell, lend, or transfer the item to any other person without authorization.
          </li>
          <li>
            <span className="font-medium">Inspection:</span> I have inspected or will inspect the item upon receipt and report any pre-existing damage immediately.
          </li>
          <li>
            <span className="font-medium">Indemnification:</span> I agree to indemnify and hold the owner harmless from any claims arising from my use of the item.
          </li>
          <li>
            <span className="font-medium">Cancellation:</span> I understand the cancellation policy and any associated fees.
          </li>
        </ol>
        
        <p className="mt-4 text-sm">
          I understand that by agreeing to these terms, I am entering into a legally binding agreement.
        </p>
      </div>
      
      <div className="mb-6">
        <label className="flex items-start">
          <input 
            type="checkbox" 
            className="mt-1 mr-2" 
            checked={isAgreed} 
            onChange={(e) => setIsAgreed(e.target.checked)}
          />
          <span className="text-sm">
            I have read and agree to the terms and conditions. I understand that I am responsible for any loss or damage to the item and will return it on time.
          </span>
        </label>
      </div>
      
      <div className="flex justify-end gap-3">
        <Button
          onClick={onCancel}
          variant="secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={onAccept}
          variant="primary"
          disabled={!isAgreed}
        >
          Accept & Continue
        </Button>
      </div>
    </div>
  );
}
