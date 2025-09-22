import React, { useState } from 'react';
import { DocumentArrowDownIcon, DocumentIcon, ShareIcon } from '@heroicons/react/24/outline';
import { RentalAgreement } from '@/src/types/rental-agreement';
import { PDFGenerator } from '@/src/lib/pdf-generator';

interface PDFDownloadProps {
  agreement: RentalAgreement;
  className?: string;
}

export const PDFDownload: React.FC<PDFDownloadProps> = ({ 
  agreement, 
  className = '' 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const downloadPDF = async (options?: any) => {
    try {
      setIsGenerating(true);
      setError(null);

      await PDFGenerator.downloadAgreementPDF(
        agreement,
        `rental-agreement-${agreement.agreementNumber}.pdf`,
        options
      );
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download PDF. Please try again.');
    } finally {
      setIsGenerating(false);
      setShowOptions(false);
    }
  };

  const generateAndUpload = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch(`/api/rental-agreements/${agreement.id}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: {
            includeSignatures: true,
            format: 'A4'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const data = await response.json();
      
      // Open the generated PDF in a new tab
      window.open(data.pdfUrl, '_blank');
      
    } catch (err) {
      console.error('Generate error:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const viewPDF = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const url = `/api/rental-agreements/${agreement.id}/pdf?download=false`;
      window.open(url, '_blank');
      
    } catch (err) {
      console.error('View error:', err);
      setError('Failed to view PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Download Button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => downloadPDF()}
          disabled={isGenerating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Download PDF
            </>
          )}
        </button>

        {/* Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ShareIcon className="h-4 w-4" />
          </button>

          {showOptions && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1" role="menu">
                <button
                  onClick={() => downloadPDF({ format: 'A4', includeSignatures: true })}
                  disabled={isGenerating}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  role="menuitem"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-3" />
                  Download (A4, with signatures)
                </button>
                
                <button
                  onClick={() => downloadPDF({ format: 'Letter', includeSignatures: true })}
                  disabled={isGenerating}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  role="menuitem"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-3" />
                  Download (Letter, with signatures)
                </button>

                <button
                  onClick={() => downloadPDF({ includeSignatures: false })}
                  disabled={isGenerating}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  role="menuitem"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-3" />
                  Download (without signatures)
                </button>

                <hr className="my-1" />

                <button
                  onClick={viewPDF}
                  disabled={isGenerating}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  role="menuitem"
                >
                  <DocumentIcon className="h-4 w-4 mr-3" />
                  View in browser
                </button>

                <button
                  onClick={generateAndUpload}
                  disabled={isGenerating}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  role="menuitem"
                >
                  <ShareIcon className="h-4 w-4 mr-3" />
                  Generate & Upload
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Agreement Status Info */}
      <div className="mt-2 text-xs text-gray-500">
        Agreement #{agreement.agreementNumber} • Status: {agreement.status.replace('_', ' ')}
        {agreement.pdfUrl && (
          <span className="ml-2 text-green-600">
            • PDF Available
          </span>
        )}
      </div>
    </div>
  );
};

export default PDFDownload;