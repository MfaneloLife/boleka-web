'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Order, OrderStatus } from '../types/order';
import {
  HandRaisedIcon,
  LockClosedIcon,
  LockOpenIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

interface VendorOrderActionsProps {
  order: Order;
  onActionComplete?: () => void;
}

const VendorOrderActions: React.FC<VendorOrderActionsProps> = ({ order, onActionComplete }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [freezeReason, setFreezeReason] = useState('');
  const [showFreezeForm, setShowFreezeForm] = useState(false);

  // Check if user is the vendor
  const isVendor = order.vendorId === user?.id;

  if (!isVendor) {
    return null;
  }

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleFreeze = async () => {
    if (!freezeReason.trim() || freezeReason.trim().length < 10) {
      setError('Please provide a detailed reason (at least 10 characters)');
      return;
    }
    
    setLoading('freeze');
    clearMessages();
    
    try {
      const res = await fetch('/api/orders/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, reason: freezeReason.trim() })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to freeze payout');
      
      setSuccess('Payout frozen successfully. The renter has been notified.');
      setShowFreezeForm(false);
      setFreezeReason('');
      
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to freeze payout');
    } finally {
      setLoading(null);
    }
  };

  const handleRelease = async () => {
    setLoading('release');
    clearMessages();
    
    try {
      const res = await fetch('/api/orders/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to release payout');
      
      setSuccess('Payout released successfully. Funds will be processed.');
      
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release payout');
    } finally {
      setLoading(null);
    }
  };

  const handleMarkReturned = async () => {
    setLoading('return');
    clearMessages();
    
    try {
      const res = await fetch('/api/orders/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark item as returned');
      
      setSuccess('Item marked as returned successfully.');
      
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark item as returned');
    } finally {
      setLoading(null);
    }
  };

  const handleSettlePayout = async () => {
    setLoading('settle');
    clearMessages();
    
    try {
      const res = await fetch('/api/payouts/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: order.id })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to settle payout');
      
      setSuccess(`Payout settled: R${data.payout.vendorPayoutAmount.toFixed(2)} to vendor, R${data.payout.platformCommission.toFixed(2)} platform commission.`);
      
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to settle payout');
    } finally {
      setLoading(null);
    }
  };

  // Status badges
  const getStatusBadge = () => {
    const statusColors: Record<string, string> = {
      [OrderStatus.AWAITING_APPROVAL]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.AWAITING_PAYMENT]: 'bg-blue-100 text-blue-800',
      [OrderStatus.PAYMENT_RECEIVED]: 'bg-green-100 text-green-800',
      [OrderStatus.FROZEN]: 'bg-red-100 text-red-800',
      [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [OrderStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
        {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  // If order is completed and returned - show settled state
  if (order.status === OrderStatus.COMPLETED) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
            Order Complete
          </h3>
          {getStatusBadge()}
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          <p>Item is awaiting return confirmation</p>
        </div>
        
        {/* Mark as Returned button */}
        <button
          onClick={handleMarkReturned}
          disabled={loading === 'return'}
          className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading === 'return' ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <TruckIcon className="h-4 w-4 mr-2" />
              Mark Item as Returned
            </>
          )}
        </button>
        
        {/* Settle Payout button (visible after return) */}
        {/* This would be shown after return is marked - the returned status is tracked via API */}
        <button
          onClick={handleSettlePayout}
          disabled={loading === 'settle'}
          className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading === 'settle' ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Settle Payout (95% Vendor)
            </>
          )}
        </button>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-2 flex items-start">
            <XCircleIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded p-2 flex items-start">
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700">{success}</p>
          </div>
        )}
      </div>
    );
  }

  // If order is FROZEN - show release button
  if (order.status === OrderStatus.FROZEN) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-red-900 flex items-center">
            <LockClosedIcon className="h-4 w-4 text-red-500 mr-2" />
            Payout Frozen
          </h3>
          {getStatusBadge()}
        </div>
        
        <div className="text-xs text-red-700 space-y-1">
          <p>The payout for this order has been frozen.</p>
          <p>You can release it when the issue is resolved.</p>
        </div>
        
        <button
          onClick={handleRelease}
          disabled={loading === 'release'}
          className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
        >
          {loading === 'release' ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <LockOpenIcon className="h-4 w-4 mr-2" />
              Release Payout
            </>
          )}
        </button>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-2 flex items-start">
            <XCircleIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded p-2 flex items-start">
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700">{success}</p>
          </div>
        )}
      </div>
    );
  }

  // If order is PAID (payment received) - show freeze button
  if (order.status === OrderStatus.PAYMENT_RECEIVED) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <HandRaisedIcon className="h-4 w-4 text-gray-500 mr-2" />
            Vendor Actions
          </h3>
          {getStatusBadge()}
        </div>

        <div className="text-xs text-gray-600">
          <p>Payment received. You can freeze the payout if needed, or wait for QR code scan to complete the order.</p>
        </div>

        {/* Freeze Button */}
        {!showFreezeForm ? (
          <button
            onClick={() => setShowFreezeForm(true)}
            className="w-full inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LockClosedIcon className="h-4 w-4 mr-2" />
            Freeze Payout
          </button>
        ) : (
          <div className="space-y-2 border border-red-200 rounded-md p-3 bg-red-50">
            <label className="block text-xs font-medium text-red-900">
              <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
              Reason for freezing payout:
            </label>
            <textarea
              value={freezeReason}
              onChange={(e) => setFreezeReason(e.target.value)}
              placeholder="Describe why you're freezing this payout (min 10 characters)..."
              className="w-full text-xs px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleFreeze}
                disabled={loading === 'freeze'}
                className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading === 'freeze' ? (
                  <>
                    <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="h-3 w-3 mr-1" />
                    Confirm Freeze
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowFreezeForm(false);
                  setFreezeReason('');
                }}
                className="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-2 flex items-start">
            <XCircleIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded p-2 flex items-start">
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700">{success}</p>
          </div>
        )}
      </div>
    );
  }

  // Default state for other statuses
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500">
        Vendor actions are available once payment is received.
      </p>
      {getStatusBadge()}
    </div>
  );
};

export default VendorOrderActions;
