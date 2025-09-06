'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrls: string[];
  location: string;
  category: string;
  availability: boolean;
}

export default function BusinessItemsPage() {
  const [items, setItems] = useState<Item[]>([
    // Mock data for demonstration
    {
      id: '101',
      title: 'Power Drill',
      description: 'Professional power drill, barely used and in excellent condition',
      price: 12,
      imageUrls: ['/drill.jpg'],
      location: 'Cape Town',
      category: 'Tools & Equipment',
      availability: true
    },
    {
      id: '102',
      title: 'Party Tent',
      description: 'Large party tent, perfect for outdoor events and gatherings',
      price: 45,
      imageUrls: ['/tent.jpg'],
      location: 'Cape Town',
      category: 'Home & Garden',
      availability: true
    }
  ]);

  const toggleAvailability = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, availability: !item.availability } : item
    ));
  };

  return (
    <div>
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Items</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your listed items and their availability
          </p>
        </div>
        <Link
          href="/dashboard/business/items/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Item
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-md mr-4">
                      {/* Placeholder for image */}
                      <div className="flex items-center justify-center h-full text-xs text-gray-500">
                        Image
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600">{item.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span className="mr-2">R{item.price}/day</span>
                        <span className="mr-2">•</span>
                        <span>{item.location}</span>
                        <span className="mr-2">•</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${
                        item.availability
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {item.availability ? 'Available' : 'Unavailable'}
                    </button>
                    <Link
                      href={`/dashboard/business/items/${item.id}/edit`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-gray-500">You haven&apos;t listed any items yet.</p>
            <div className="mt-5">
              <Link
                href="/dashboard/business/items/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Your First Item
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
