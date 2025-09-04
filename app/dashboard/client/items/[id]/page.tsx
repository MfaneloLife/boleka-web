'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Button from '@/components/Button';
import SendMessageModal from '@/components/SendMessageModal';

interface ItemPageProps {
  params: {
    id: string;
  };
}

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  imageUrls: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    image: string | null;
  };
}

export default function ItemPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Fetch item data
  const fetchItem = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/items/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch item');
      }
      
      const data = await response.json();
      setItem(data);
    } catch (err) {
      console.error('Error fetching item:', err);
      setError('Failed to load item details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if the current user is the owner
  const isOwner = session?.user?.email === item?.owner.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : item ? (
        <div>
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
            {/* Image gallery */}
            <div className="flex flex-col">
              <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
                {item.imageUrls && item.imageUrls.length > 0 ? (
                  <Image
                    src={item.imageUrls[0]}
                    alt={item.title}
                    width={500}
                    height={500}
                    className="w-full h-full object-center object-cover"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* More images */}
              {item.imageUrls && item.imageUrls.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {item.imageUrls.slice(1).map((image, index) => (
                    <div key={index} className="aspect-w-1 aspect-h-1 rounded-md overflow-hidden">
                      <Image
                        src={image}
                        alt={`${item.title} - Image ${index + 2}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-center object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Item details */}
            <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{item.title}</h1>
              
              <div className="mt-3">
                <h2 className="sr-only">Item information</h2>
                <p className="text-3xl text-gray-900">R{item.price.toFixed(2)}</p>
              </div>

              <div className="mt-6">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="ml-2 text-sm text-gray-700">{item.location}</p>
                </div>
                
                <div className="mt-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="ml-2 text-sm text-gray-700">Posted on {formatDate(item.createdAt)}</p>
                </div>
                
                <div className="mt-4 flex items-center">
                  <div className="flex-shrink-0">
                    {item.owner.image ? (
                      <Image
                        src={item.owner.image}
                        alt={item.owner.name || 'Owner'}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                        {item.owner.name ? item.owner.name.charAt(0).toUpperCase() : 'O'}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {item.owner.name || 'Owner'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Verified Business
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900">Description</h3>
                <div className="mt-2 prose prose-sm text-gray-700">
                  <p>{item.description}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col">
                {!isOwner && session?.user?.email && (
                  <Button 
                    onClick={() => setShowMessageModal(true)} 
                    className="w-full"
                  >
                    Send Message
                  </Button>
                )}
                
                {!session?.user?.email && (
                  <div className="text-center mt-2">
                    <p className="text-sm text-gray-600">
                      <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500">
                        Sign in
                      </Link> to send a message to the owner
                    </p>
                  </div>
                )}
                
                {isOwner && (
                  <div className="flex gap-3">
                    <Link href={`/dashboard/business/items/edit/${item.id}`} className="w-full">
                      <Button className="w-full">
                        Edit Item
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Item not found</h2>
          <p className="mt-2 text-gray-600">This item may have been removed or doesn't exist.</p>
          <div className="mt-6">
            <Link href="/dashboard/client/search" className="text-indigo-600 hover:text-indigo-500">
              Go back to search
            </Link>
          </div>
        </div>
      )}

      {showMessageModal && item && (
        <SendMessageModal
          itemId={item.id}
          ownerId={item.owner.id}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  );
}
