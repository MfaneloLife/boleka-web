'use client';

import { useState, useRef } from 'react';
import { DocumentTextIcon, DocumentArrowDownIcon, PencilIcon } from '@heroicons/react/24/outline';
import { RentalAgreement, formatAgreementPeriod, getDaysUntilReturn } from '@/src/types/rental-agreement';
import PDFDownload from './PDFDownload';

interface RentalAgreementViewProps {
  agreement: RentalAgreement;
  currentUserId: string;
  onSign?: (signature: string) => Promise<void>;
  canModify?: boolean;
}

export default function RentalAgreementView({
  agreement,
  currentUserId,
  onSign,
  canModify = false
}: RentalAgreementViewProps) {
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [signature, setSignature] = useState('');
  const [signing, setSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isOwner = agreement.owner.id === currentUserId;
  const isRenter = agreement.renter.id === currentUserId;
  const userRole = isOwner ? 'owner' : isRenter ? 'renter' : null;

  const canSign = () => {
    if (!userRole) return false;
    const validStatus = ['draft', 'pending_signatures'].includes(agreement.status);
    const hasntSigned = isOwner ? !agreement.owner.signedAt : !agreement.renter.signedAt;
    return validStatus && hasntSigned;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_signatures': return 'bg-yellow-100 text-yellow-800';
      case 'signed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSign = async () => {
    if (!signature.trim() || !onSign) return;
    
    setSigning(true);
    try {
      await onSign(signature);
      setIsSigningMode(false);
      setSignature('');
    } catch (error) {
      console.error('Error signing agreement:', error);
      alert('Failed to sign agreement. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rental Agreement</h1>
            <p className="text-sm text-gray-600">Agreement #{agreement.agreementNumber}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agreement.status)}`}>
              {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1).replace('_', ' ')}
            </span>
            <PDFDownload agreement={agreement} />
          </div>
        </div>
      </div>

      {/* Agreement Content */}
      <div className="px-6 py-6 space-y-8">
        {/* Parties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Owner (Lessor)</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {agreement.owner.name}</p>
              <p><span className="font-medium">Email:</span> {agreement.owner.email}</p>
              {agreement.owner.phone && (
                <p><span className="font-medium">Phone:</span> {agreement.owner.phone}</p>
              )}
              {agreement.owner.address && (
                <p><span className="font-medium">Address:</span> {agreement.owner.address}</p>
              )}
              {agreement.owner.signedAt && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-green-600 font-medium">✓ Signed on {formatDate(agreement.owner.signedAt)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Renter (Lessee)</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {agreement.renter.name}</p>
              <p><span className="font-medium">Email:</span> {agreement.renter.email}</p>
              {agreement.renter.phone && (
                <p><span className="font-medium">Phone:</span> {agreement.renter.phone}</p>
              )}
              {agreement.renter.address && (
                <p><span className="font-medium">Address:</span> {agreement.renter.address}</p>
              )}
              {agreement.renter.signedAt && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-green-600 font-medium">✓ Signed on {formatDate(agreement.renter.signedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Rental Property</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Item:</span> {agreement.property.title}</p>
              <p><span className="font-medium">Category:</span> {agreement.property.category}</p>
              <p><span className="font-medium">Condition:</span> {agreement.property.condition}</p>
              <p><span className="font-medium">Estimated Value:</span> {formatCurrency(agreement.property.estimatedValue)}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Description:</span></p>
              <p className="text-gray-600">{agreement.property.description}</p>
            </div>
          </div>
        </div>

        {/* Rental Terms */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Rental Terms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><span className="font-medium">Rental Period:</span> {formatAgreementPeriod(agreement)}</p>
              <p><span className="font-medium">Start Date:</span> {formatDate(agreement.rentalPeriod.startDate)}</p>
              <p><span className="font-medium">End Date:</span> {formatDate(agreement.rentalPeriod.endDate)}</p>
              <p><span className="font-medium">Pickup Time:</span> {agreement.rentalPeriod.pickupTime}</p>
              <p><span className="font-medium">Return Time:</span> {agreement.rentalPeriod.returnTime}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Pickup Location:</span> {agreement.rentalPeriod.pickupLocation}</p>
              <p><span className="font-medium">Return Location:</span> {agreement.rentalPeriod.returnLocation}</p>
              {agreement.status === 'active' && (
                <p><span className="font-medium">Days Until Return:</span> 
                  <span className={`ml-1 ${getDaysUntilReturn(agreement) <= 1 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                    {getDaysUntilReturn(agreement)} days
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Terms */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Financial Terms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><span className="font-medium">Daily Rate:</span> {formatCurrency(agreement.financial.dailyRate)}</p>
              <p><span className="font-medium">Total Days:</span> {agreement.financial.totalDays}</p>
              <p><span className="font-medium">Subtotal:</span> {formatCurrency(agreement.financial.subtotal)}</p>
              <p><span className="font-medium">Security Deposit:</span> {formatCurrency(agreement.financial.securityDeposit)}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Platform Fee:</span> {formatCurrency(agreement.financial.platformFee)}</p>
              <p><span className="font-medium text-lg">Total Amount:</span> <span className="text-lg font-bold">{formatCurrency(agreement.financial.totalAmount)}</span></p>
              <p><span className="font-medium">Payment Method:</span> {agreement.financial.paymentMethod}</p>
              <p><span className="font-medium">Payment Due:</span> {formatDate(agreement.financial.paymentDueDate)}</p>
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Policies & Terms</h3>
          
          <div className="space-y-4">
            {/* Late Fees */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Late Return Fees</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Grace Period: {agreement.policies.lateFees.gracePeriod} hours</p>
                <p>• Daily Late Fee: {formatCurrency(agreement.policies.lateFees.dailyRate)}</p>
                <p>• Maximum Late Fee: {formatCurrency(agreement.policies.lateFees.maximumFee)}</p>
              </div>
            </div>

            {/* Damage Fees */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Damage Fees</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Minor Damage: {agreement.policies.damageFees.minorDamage}% of item value</p>
                <p>• Major Damage: {agreement.policies.damageFees.majorDamage}% of item value</p>
                <p>• Total Loss: {agreement.policies.damageFees.totalLoss}% of item value</p>
              </div>
            </div>

            {/* Return Policy */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Return Policy</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• {agreement.policies.returnPolicy.condition}</p>
                <p>• Cleaning Required: {agreement.policies.returnPolicy.cleaningRequired ? 'Yes' : 'No'}</p>
                <p>• Inspection Required: {agreement.policies.returnPolicy.inspectionRequired ? 'Yes' : 'No'}</p>
                <p>• Instructions: {agreement.policies.returnPolicy.returnInstructions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Special Terms and Restrictions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Special Terms */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Special Terms</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {agreement.specialTerms.map((term, index) => (
                <li key={index}>• {term}</li>
              ))}
            </ul>
          </div>

          {/* Restrictions */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Restrictions</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {agreement.restrictions.map((restriction, index) => (
                <li key={index}>• {restriction}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Signatures Section */}
        {canSign() && (
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Electronic Signature Required</h3>
            
            {!isSigningMode ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {isOwner ? 'As the owner, you need to sign this agreement.' : 'As the renter, you need to sign this agreement.'}
                </p>
                <button
                  onClick={() => setIsSigningMode(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Sign Agreement
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type your full name to sign electronically:
                  </label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder={isOwner ? agreement.owner.name : agreement.renter.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="text-xs text-gray-500">
                  <p>By typing your name above, you agree that this constitutes a legal signature and that you agree to all terms and conditions outlined in this rental agreement.</p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSign}
                    disabled={!signature.trim() || signing}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signing ? 'Signing...' : 'Confirm Signature'}
                  </button>
                  <button
                    onClick={() => {
                      setIsSigningMode(false);
                      setSignature('');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legal Footer */}
        <div className="border-t border-gray-200 pt-6 text-xs text-gray-500">
          <p><span className="font-medium">Governing Law:</span> {agreement.governingLaw}</p>
          <p><span className="font-medium">Dispute Resolution:</span> {agreement.disputeResolution}</p>
          <p className="mt-2">This agreement was created on {formatDate(agreement.createdAt)} and last updated on {formatDate(agreement.updatedAt)}.</p>
        </div>
      </div>
    </div>
  );
}