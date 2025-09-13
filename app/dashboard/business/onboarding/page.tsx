"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function BusinessOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  
  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Redirect to the banking details page when finished
      router.push('/dashboard/business/banking-details');
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Welcome to Boleka Business</h1>
      
      {/* Step Indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((step) => (
          <div 
            key={step} 
            className={`flex flex-col items-center ${step < currentStep ? 'text-green-600' : step === currentStep ? 'text-orange-600' : 'text-gray-400'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              step < currentStep ? 'bg-green-100 border-2 border-green-600' : 
              step === currentStep ? 'bg-orange-100 border-2 border-orange-600' : 
              'bg-gray-100 border-2 border-gray-300'
            }`}>
              {step < currentStep ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <span className="text-sm font-semibold">{step}</span>
              )}
            </div>
            <span className="text-sm">
              {step === 1 ? 'How It Works' : 
               step === 2 ? 'Platform Fee' : 
               'Banking Details'}
            </span>
          </div>
        ))}
      </div>
      
      {/* Step Content */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">How Boleka Business Works</h2>
            <p className="text-sm text-gray-600">
              Start renting your items and earning money
            </p>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <span className="font-bold text-orange-600">1</span>
              </div>
              <div>
                <h3 className="font-medium">List Your Items</h3>
                <p className="text-sm text-gray-600">
                  Add photos, descriptions, and pricing for the items you want to rent out.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <span className="font-bold text-orange-600">2</span>
              </div>
              <div>
                <h3 className="font-medium">Receive Rental Requests</h3>
                <p className="text-sm text-gray-600">
                  Customers will browse your items and send rental requests. You can accept or decline.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <span className="font-bold text-orange-600">3</span>
              </div>
              <div>
                <h3 className="font-medium">Get Paid</h3>
                <p className="text-sm text-gray-600">
                  When customers pay for their rental, the money (minus platform fee) goes to your account.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <span className="font-bold text-orange-600">4</span>
              </div>
              <div>
                <h3 className="font-medium">Manage Your Business</h3>
                <p className="text-sm text-gray-600">
                  Track your rentals, earnings, and customer feedback all in one place.
                </p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t">
            <button 
              onClick={handleContinue}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Continue
            </button>
          </div>
        </div>
      )}
      
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Platform Fee Structure</h2>
            <p className="text-sm text-gray-600">
              Understanding how payments work on Boleka
            </p>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-6">
              <h3 className="font-medium text-orange-800 mb-2">Boleka&apos;s Platform Fee: 5%</h3>
              <p className="text-sm text-gray-700">
                Boleka charges a 5% fee on all successful rental transactions. This fee helps us maintain and improve the platform, process payments securely, and provide customer support.
              </p>
            </div>
            
            <h3 className="font-medium mb-3">How it works:</h3>
            
            <div className="border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-600">Customer pays:</p>
                  <p className="font-medium">R1,000.00</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total payment</p>
                </div>
              </div>
              
              <div className="my-4 border-t border-dashed"></div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-sm text-gray-600">Boleka platform fee (8%):</p>
                  <p className="font-medium text-orange-600">-R50.00</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Deducted automatically</p>
                </div>
              </div>
              
              <div className="my-4 border-t"></div>
              
              <div className="grid grid-cols-2 gap-2 bg-green-50 p-2 rounded">
                <div>
                  <p className="text-sm text-gray-600">You receive:</p>
                  <p className="font-medium text-green-600">R950.00</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Paid to your bank account</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              The platform fee is automatically calculated and deducted from each payment. You&apos;ll always see a clear breakdown of the total amount, platform fee, and your net earnings in your dashboard.
            </p>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t">
            <button 
              onClick={handleContinue}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Continue
            </button>
          </div>
        </div>
      )}
      
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Banking Details</h2>
            <p className="text-sm text-gray-600">
              Set up your account to receive payments
            </p>
          </div>
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-gray-700 mb-4">
              To receive your rental earnings, you&apos;ll need to add your banking details. This information is securely stored and used only for processing your payouts.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
              <h3 className="font-medium text-blue-800 mb-2">Information we&apos;ll need:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>Bank name</li>
                <li>Account number</li>
                <li>Account type (current, savings, etc.)</li>
                <li>Branch code</li>
                <li>Account holder name</li>
              </ul>
            </div>
            
            <p className="text-sm text-gray-700">
              After you provide your banking information, you&apos;ll be all set to start receiving payments for your rentals. Your earnings will be transferred to your bank account after the platform fee has been deducted.
            </p>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t">
            <button 
              onClick={handleContinue}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Set Up Banking Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
