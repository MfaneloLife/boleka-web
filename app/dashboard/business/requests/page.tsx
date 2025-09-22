'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { OrderStatus, PaymentMethod } from '@/src/types/order';
import { OrderService } from '@/src/lib/order-service';
import QRCodeComponent from '@/src/components/QRCodeComponent';
import QRScanner from '@/src/components/QRScanner';
import PaymentFlow from '@/src/components/PaymentFlow';
import { auth } from '@/src/lib/firebase';

// Extended Request interface that integrates with Order system
interface BusinessRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  itemDescription: string;
  itemPrice: number;
  itemImageUrls: string[];
  itemLocation: string;
  itemCategory: string;
  ownerName: string;
  ownerEmail: string;
  requesterName: string;
  requesterEmail: string;
  status: string; // 'pending', 'accepted', 'rejected', 'completed', 'paid'
  
  // Payment workflow integration
  orderId?: string; // Links to Order when request is accepted
  paymentType?: string;
  paymentStatus?: string;
  paymentMethod?: PaymentMethod;
  qrCode?: string;
  qrCodeExpiry?: any;
  approvalExpiry?: any;
  
  createdAt: any;
  updatedAt: any;
}

export default function BusinessRequestsPage() {
  const [requests, setRequests] = useState<BusinessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'scanner'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<BusinessRequest | null>(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchRequests();
      } else {
        setRequests([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Fetch requests where current user is the owner (received requests)
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/requests?type=received`, {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (request: BusinessRequest) => {
    try {
      // Update request status to accepted
      const idToken = await auth.currentUser?.getIdToken();
      const updateResponse = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          status: 'accepted',
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!updateResponse.ok) throw new Error('Failed to update request');

      // Create an order for payment workflow
      const items = [{
        id: request.itemId,
        itemId: request.itemId,
        itemName: request.itemTitle,
        itemImage: request.itemImageUrls[0] || '',
        quantity: 1,
        unitPrice: request.itemPrice,
        totalPrice: request.itemPrice,
        vendorId: auth.currentUser?.email || '',
        vendorName: auth.currentUser?.displayName || '',
      }];

      const orderId = await OrderService.createOrder(
        request.requesterEmail,
        request.requesterName,
        request.requesterEmail,
        items,
        PaymentMethod.CARD, // Default, can be changed
        undefined, // userPhone
        `Order for request: ${request.itemTitle}` // notes
      );

      // Link the order to the request
      await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          orderId: orderId,
          paymentStatus: 'awaiting_payment',
          updatedAt: new Date().toISOString(),
        }),
      });

      // Refresh requests
      await fetchRequests();
      
      alert('Request approved! Payment workflow initiated.');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  const handleDeclineRequest = async (request: BusinessRequest) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          status: 'rejected',
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to update request');

      await fetchRequests();
      alert('Request declined.');
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request. Please try again.');
    }
  };

  const handleQRScan = async (scannedData: string) => {
    try {
      // Process QR code scan for payment confirmation
      const response = await fetch('/api/orders/qr-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrData: scannedData,
          vendorId: auth.currentUser?.email,
        }),
      });

      if (!response.ok) throw new Error('Invalid QR code');

      const result = await response.json();
      alert(`Payment confirmed for order ${result.orderId}`);
      
      // Refresh requests to show updated status
      await fetchRequests();
    } catch (error) {
      console.error('QR scan error:', error);
      alert('Invalid or expired QR code.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const pendingRequests = requests.filter(request => request.status === 'pending');
  const displayRequests = activeTab === 'pending' ? pendingRequests : requests;

  if (!auth.currentUser?.email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please sign in</h2>
          <p className="mt-2 text-gray-600">You need to be signed in to manage your requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Requests</h1>
        <p className="mt-2 text-gray-600">
          Manage incoming requests, approve orders, and process payments
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex flex-wrap gap-4 sm:space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Requests
            {requests.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scanner'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            QR Scanner
          </button>
        </nav>
      </div>

      {/* QR Scanner Tab */}
      {activeTab === 'scanner' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Code Scanner</h2>
          <p className="text-gray-600 mb-6">
            Scan customer QR codes to confirm cash payments and complete orders.
          </p>
          <QRScanner onOrderComplete={handleQRScan} />
        </div>
      )}

      {/* Requests List */}
      {activeTab !== 'scanner' && (
        <>
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && displayRequests.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {activeTab === 'pending' 
                  ? 'No pending requests' 
                  : 'No requests found'
                }
              </h3>
              <p className="mt-2 text-gray-500">
                {activeTab === 'pending' 
                  ? 'You don\'t have any pending requests at the moment.'
                  : 'You haven\'t received any requests yet. Make sure your items are listed and visible.'
                }
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/business/items"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Manage Items
                </Link>
              </div>
            </div>
          )}

          {/* Requests List */}
          {!loading && displayRequests.length > 0 && (
            <div className="space-y-6">
              {displayRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white shadow-sm rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 flex-col sm:flex-row">
                    {/* Item Image */}
                    <div className="flex-shrink-0 w-20 h-20 relative self-start">
                      {request.itemImageUrls && request.itemImageUrls.length > 0 ? (
                        <Image
                          src={request.itemImageUrls[0]}
                          alt={request.itemTitle}
                          fill
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Request Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {request.itemTitle}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            R{request.itemPrice.toFixed(2)} • {request.itemLocation}
                          </p>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {request.itemDescription}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Request Info */}
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="text-sm text-gray-500">
                          <span>Requested by: <span className="font-medium">{request.requesterName}</span></span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </div>
                      </div>

                      {/* Payment Info */}
                      {request.orderId && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">
                              Order ID: {request.orderId}
                            </span>
                            {request.paymentStatus && (
                              <span className="text-sm text-blue-700">
                                Payment: {request.paymentStatus}
                              </span>
                            )}
                          </div>
                          {request.qrCode && (
                            <div className="mt-2">
                              <QRCodeComponent 
                                order={{
                                  id: request.orderId!,
                                  status: 'payment_received' as any,
                                  totalAmount: request.itemPrice * 1.08,
                                  qrCode: request.qrCode,
                                  vendorId: auth.currentUser?.uid || '',
                                  userId: request.requesterEmail,
                                  items: [{
                                    id: request.itemId,
                                    itemName: request.itemTitle,
                                    totalPrice: request.itemPrice
                                  }] as any
                                } as any}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(request)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Approve Request
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(request)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        
                        <Link
                          href={`/messages/${request.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Messages
                        </Link>
                        
                        <Link
                          href={`/dashboard/business/items/${request.itemId}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-600 hover:text-blue-500"
                        >
                          View Item
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}