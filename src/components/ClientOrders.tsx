import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Order, OrderStatus, getOrderStatusDisplay } from '../types/order';
import { OrderService } from '../lib/order-service';
import QRCodeComponent from './QRCodeComponent';
import PaymentFlow from './PaymentFlow';
import { ClockIcon, EyeIcon, CreditCardIcon, QrCodeIcon } from '@heroicons/react/24/outline';

const ClientOrders: React.FC = () => {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'details' | 'payment' | 'qr'>('details');

  // Helper function for currency formatting
  const formatCurrency = (amount: number): string => {
    return `R${amount.toFixed(2)}`;
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadOrders();
    }
  }, [session]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const userOrders = await OrderService.getUserOrders(session?.user?.id || '');
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.AWAITING_APPROVAL:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.AWAITING_PAYMENT:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.CASH_PAYMENT:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.PAYMENT_RECEIVED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case OrderStatus.EXPIRED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getOrderStatusMessage = (order: Order) => {
    switch (order.status) {
      case OrderStatus.AWAITING_APPROVAL:
        return 'Waiting for vendor approval';
      case OrderStatus.AWAITING_PAYMENT:
        return 'Ready for payment';
      case OrderStatus.CASH_PAYMENT:
        return 'Pay with cash when collecting';
      case OrderStatus.PAYMENT_RECEIVED:
        return 'Payment received - ready for collection';
      case OrderStatus.COMPLETED:
        return 'Order completed';
      case OrderStatus.CANCELLED:
        return 'Order cancelled';
      case OrderStatus.EXPIRED:
        return 'Order expired';
      default:
        return 'Unknown status';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            My Orders ({orders.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Track your orders and manage payments
          </p>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {orders.map((order) => (
            <li key={order.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Order #{order.id.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Vendor: {order.vendorName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.items.length} item(s) • {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {formatDate(order.createdAt)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {getOrderStatusMessage(order)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                        {getOrderStatusDisplay(order.status)}
                      </span>
                      
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setActiveView('details');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      {(order.status === OrderStatus.AWAITING_PAYMENT || order.status === OrderStatus.CASH_PAYMENT) && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setActiveView('payment');
                          }}
                          className="text-green-600 hover:text-green-800"
                          title="Make Payment"
                        >
                          <CreditCardIcon className="h-5 w-5" />
                        </button>
                      )}
                      
                      {order.status === OrderStatus.PAYMENT_RECEIVED && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setActiveView('qr');
                          }}
                          className="text-purple-600 hover:text-purple-800"
                          title="Generate QR Code"
                        >
                          <QrCodeIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        {orders.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Orders will appear here when you place them.
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Order #{selectedOrder.id.slice(-8)}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveView('details')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Order Details
                  </button>
                  
                  {(selectedOrder.status === OrderStatus.AWAITING_PAYMENT || selectedOrder.status === OrderStatus.CASH_PAYMENT) && (
                    <button
                      onClick={() => setActiveView('payment')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeView === 'payment'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Payment
                    </button>
                  )}
                  
                  {selectedOrder.status === OrderStatus.PAYMENT_RECEIVED && (
                    <button
                      onClick={() => setActiveView('qr')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeView === 'qr'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Collection QR
                    </button>
                  )}
                </nav>
              </div>

              {/* Tab Content */}
              {activeView === 'details' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Vendor Information</h4>
                    <p className="text-sm text-gray-600">Name: {selectedOrder.vendorName}</p>
                    <p className="text-sm text-gray-600">Email: {selectedOrder.vendorEmail}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Order Status</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedOrder.status)}`}>
                        {getOrderStatusDisplay(selectedOrder.status)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {getOrderStatusMessage(selectedOrder)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Order Items</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-medium">{formatCurrency(item.unitPrice * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Fee (8%):</span>
                        <span>{formatCurrency(selectedOrder.platformFee)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Total:</span>
                        <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedOrder.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900">Your Notes</h4>
                      <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                    </div>
                  )}

                  {selectedOrder.vendorApprovalNotes && (
                    <div>
                      <h4 className="font-medium text-gray-900">Vendor Notes</h4>
                      <p className="text-sm text-gray-600">{selectedOrder.vendorApprovalNotes}</p>
                    </div>
                  )}

                  {selectedOrder.cancellationReason && (
                    <div>
                      <h4 className="font-medium text-gray-900">Cancellation Reason</h4>
                      <p className="text-sm text-red-600">{selectedOrder.cancellationReason}</p>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'payment' && (
                <PaymentFlow 
                  order={selectedOrder} 
                  onPaymentComplete={() => {
                    loadOrders();
                    setSelectedOrder(null);
                  }} 
                />
              )}

              {activeView === 'qr' && (
                <QRCodeComponent 
                  order={selectedOrder}
                  onOrderComplete={() => {
                    loadOrders();
                    setSelectedOrder(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientOrders;