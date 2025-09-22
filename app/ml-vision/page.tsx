'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import MLBarcodeScanner from '@/src/components/MLBarcodeScanner';
import FirebaseCloudMessaging from '@/src/lib/firebase-messaging';
import { 
  DocumentTextIcon, 
  TagIcon, 
  PhotoIcon, 
  BellIcon,
  ClockIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface ScanHistory {
  barcodes: any[];
  textExtractions: any[];
  notifications: any[];
}

export default function MLVisionPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('scanner');
  const [scanHistory, setScanHistory] = useState<ScanHistory>({
    barcodes: [],
    textExtractions: [],
    notifications: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fcmInitialized, setFcmInitialized] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadScanHistory();
      initializeNotifications();
    }
  }, [session]);

  const initializeNotifications = async () => {
    try {
      if (session?.user?.id && !fcmInitialized) {
        const success = await FirebaseCloudMessaging.initializeForUser(session.user.id);
        setFcmInitialized(success);
        
        if (success) {
          // Send test notification
          await FirebaseCloudMessaging.sendNotificationToUser(session.user.id, {
            title: '🚀 ML Vision Ready',
            body: 'Your barcode scanner and image analysis tools are ready to use!',
            icon: '/icons/ml-vision-icon.png',
            tag: 'ml-vision-ready'
          });
        }
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const loadScanHistory = async () => {
    try {
      setLoading(true);
      
      const [barcodesRes, textRes, notificationsRes] = await Promise.all([
        fetch('/api/ml-vision/barcode-history'),
        fetch('/api/ml-vision/analyze?type=text'),
        fetch('/api/fcm/send')
      ]);

      const barcodes = barcodesRes.ok ? await barcodesRes.json() : { barcodes: [] };
      const text = textRes.ok ? await textRes.json() : { results: [] };
      const notifications = notificationsRes.ok ? await notificationsRes.json() : { notifications: [] };

      setScanHistory({
        barcodes: barcodes.barcodes || [],
        textExtractions: text.results || [],
        notifications: notifications.notifications || []
      });
    } catch (error) {
      console.error('Error loading scan history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = async (result: any) => {
    console.log('Barcode scanned:', result);
    
    // Send notification
    if (session?.user?.id && fcmInitialized) {
      await FirebaseCloudMessaging.notifyBarcodeScanned(
        session.user.id,
        result.data,
        result.type
      );
    }
    
    // Reload history
    loadScanHistory();
  };

  const handleTextExtracted = async (text: string) => {
    console.log('Text extracted:', text);
    
    // Send notification
    if (session?.user?.id && fcmInitialized) {
      await FirebaseCloudMessaging.sendMLVisionNotification(
        session.user.id,
        'text',
        {
          itemsFound: 1,
          preview: text.substring(0, 50)
        }
      );
    }
    
    // Reload history
    loadScanHistory();
  };

  const handleLabelsDetected = async (labels: string[]) => {
    console.log('Labels detected:', labels);
    
    // Send notification
    if (session?.user?.id && fcmInitialized) {
      await FirebaseCloudMessaging.sendMLVisionNotification(
        session.user.id,
        'labels',
        {
          itemsFound: labels.length,
          preview: labels.slice(0, 3).join(', ')
        }
      );
    }
    
    // Reload history
    loadScanHistory();
  };

  const searchExtractedText = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/ml-vision/text-search?q=${encodeURIComponent(searchQuery)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Error searching text:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBarcodeFromHistory = async (barcodeId: string) => {
    try {
      const response = await fetch(`/api/ml-vision/barcode-history?id=${barcodeId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadScanHistory();
      }
    } catch (error) {
      console.error('Error deleting barcode:', error);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleString();
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to use ML Vision features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔍 ML Vision & Barcode Scanner</h1>
          <p className="mt-2 text-gray-600">
            Scan barcodes, extract text, and analyze images with Firebase ML Vision
          </p>
          
          {/* Notification Status */}
          {fcmInitialized && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-green-600">
              <BellIcon className="h-4 w-4" />
              <span>Push notifications enabled</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'scanner', name: 'Scanner', icon: TagIcon },
              { id: 'history', name: 'History', icon: ClockIcon },
              { id: 'search', name: 'Search Text', icon: MagnifyingGlassIcon },
              { id: 'notifications', name: 'Notifications', icon: BellIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Scanner Tab */}
          {activeTab === 'scanner' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Barcode & Image Scanner</h2>
              <MLBarcodeScanner
                onBarcodeScanned={handleBarcodeScanned}
                onTextExtracted={handleTextExtracted}
                onLabelsDetected={handleLabelsDetected}
                onError={(error) => console.error('Scanner error:', error)}
                enableTextExtraction={true}
                enableImageLabeling={true}
                enableBarcodeScanning={true}
                className="max-w-2xl"
              />
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Scan History</h2>
                <button
                  onClick={loadScanHistory}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {/* Barcodes */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <TagIcon className="h-5 w-5 mr-2" />
                  Scanned Barcodes ({scanHistory.barcodes.length})
                </h3>
                <div className="space-y-3">
                  {scanHistory.barcodes.map((barcode, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{barcode.type}</div>
                        <div className="text-sm text-gray-600 font-mono">{barcode.data}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(barcode.extractedAt)} • Confidence: {(barcode.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <button
                        onClick={() => deleteBarcodeFromHistory(barcode.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete barcode from history"
                        aria-label="Delete barcode from history"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {scanHistory.barcodes.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No barcodes scanned yet</p>
                  )}
                </div>
              </div>

              {/* Text Extractions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Extracted Text ({scanHistory.textExtractions.length})
                </h3>
                <div className="space-y-3">
                  {scanHistory.textExtractions.map((extraction, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 whitespace-pre-wrap mb-2">
                        {extraction.extractedText}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(extraction.extractedAt)} • Confidence: {(extraction.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                  {scanHistory.textExtractions.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No text extracted yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Search Extracted Text</h2>
              
              <div className="flex space-x-3 mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search through extracted text..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && searchExtractedText()}
                />
                <button
                  onClick={searchExtractedText}
                  disabled={loading || !searchQuery.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Search
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Search Results ({searchResults.length})</h3>
                  {searchResults.map((result, index) => (
                    <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-gray-600 whitespace-pre-wrap mb-2">
                        {result.extractedText}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(result.extractedAt)} • Confidence: {(result.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification History</h2>
              
              <div className="space-y-3">
                {scanHistory.notifications.map((notification, index) => (
                  <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-900">{notification.title}</div>
                    <div className="text-sm text-blue-700 mt-1">{notification.body}</div>
                    <div className="text-xs text-blue-600 mt-2">
                      {formatDate(notification.sentAt)} • Status: {notification.status}
                    </div>
                  </div>
                ))}
                {scanHistory.notifications.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No notifications sent yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}