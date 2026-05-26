"use client";

import { useState } from 'react';

interface TermsAndConditionsProps {
  itemName: string;
  returnDate?: string;
  onAccept: () => void;
  onCancel: () => void;
}

export default function TermsAndConditions({
  itemName,
  returnDate,
  onAccept,
  onCancel,
}: TermsAndConditionsProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms and Conditions</h3>
        
        <div className="space-y-4 text-sm text-gray-700">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Rental Agreement</h4>
            <p>
              By proceeding with this payment, you agree to the following terms:
            </p>
          </div>

          <ul className="space-y-3 pl-4">
            <li className="flex gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>
                <strong>Payment:</strong> You will be charged <strong>R{/* amount will show in payment step */}</strong> for renting <strong>{itemName}</strong>.
              </span>
            </li>
            {returnDate && (
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>
                  <strong>Return Date:</strong> The item is expected to be returned by <strong>{returnDate}</strong>.
                </span>
              </li>
            )}
            <li className="flex gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>
                <strong>Item Care:</strong> You agree to take reasonable care of the item during the rental period.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>
                <strong>Fee Split:</strong> 95% of the payment goes to the item owner, and 5% is retained by BOLEKA as a platform fee.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>
                <strong>Cancellation:</strong> You may cancel within 24 hours for a full refund, subject to the owner's approval.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>
                <strong>Disputes:</strong> Any disputes will be mediated by BOLEKA support.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">
          I have read and agree to the terms and conditions above.
        </span>
      </label>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onAccept}
          disabled={!accepted}
          className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
        >
          Accept & Continue to Payment
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
