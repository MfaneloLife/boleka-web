'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/src/lib/firebase';

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  status: 'available' | 'rented' | 'maintenance';
  ownerId: string;
  location?: string;
  quantity?: number;
  createdAt: string;
  updatedAt: string;
}

export default function BusinessItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Edit state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      await fetchUserItems();
    });
    return () => unsub();
  }, [router]);

  const fetchUserItems = async () => {
    try {
      setIsLoading(true);
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/items?ownerId=me', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to load your items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      const item = items.find(item => item.id === id);
      if (!item) return;

      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          // Keep legacy isAvailable for compatibility if used downstream
          isAvailable: item.status !== 'available',
          status: item.status === 'available' ? 'maintenance' : 'available',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item availability');
      }

      // Update local state
      setItems(items.map(item => 
        item.id === id
          ? {
              ...item,
              status: item.status === 'available' ? 'maintenance' : 'available',
            }
          : item
      ));
    } catch (err) {
      console.error('Error updating item availability:', err);
      setError('Failed to update item availability');
    }
  };

  const deleteItemById = async (id: string) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this item? This cannot be undone.');
      if (!confirmed) return;
      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to delete an item');
        return;
      }
      const idToken = await user.getIdToken(true);
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete item');
      }
      // Remove item from local state
      setItems(prev => prev.filter(it => it.id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const openEdit = (item: Item) => {
    setEditItemId(item.id);
    setEditPrice(String(item.price ?? ''));
    setEditQuantity(String(item.quantity ?? ''));
    setEditLocation(item.location ?? '');
    setError(null);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    if (isSaving) return;
    setIsEditOpen(false);
    setEditItemId(null);
    setEditPrice('');
    setEditQuantity('');
    setEditLocation('');
  };

  const saveEdits = async () => {
    try {
      if (!editItemId) return;
      setIsSaving(true);
      setError(null);

      // Validate inputs
      const priceNum = Number(editPrice);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        setError('Price must be a non-negative number.');
        setIsSaving(false);
        return;
      }
      const qtyTrim = editQuantity.trim();
      const qtyNum = qtyTrim === '' ? undefined : Number(qtyTrim);
      if (qtyNum !== undefined && (!Number.isInteger(qtyNum) || qtyNum < 0)) {
        setError('Quantity must be a whole number greater than or equal to 0.');
        setIsSaving(false);
        return;
      }
      if (!editLocation.trim()) {
        setError('Location is required.');
        setIsSaving(false);
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to update an item.');
        setIsSaving(false);
        return;
      }
      const idToken = await user.getIdToken(true);
      const res = await fetch(`/api/items/${editItemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          price: priceNum,
          location: editLocation.trim(),
          // Store quantity only if provided; keeps backward compat if field didn't exist
          ...(qtyNum !== undefined ? { quantity: qtyNum } : {}),
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to update item');
      }

      // Update local list optimistically
      setItems((prev) => prev.map((it) => {
        if (it.id !== editItemId) return it;
        return {
          ...it,
          price: priceNum,
          location: editLocation.trim(),
          quantity: qtyNum !== undefined ? qtyNum : it.quantity,
          updatedAt: new Date().toISOString(),
        };
      }));

      closeEdit();
    } catch (e) {
      console.error('Error saving edits:', e);
      setError(e instanceof Error ? e.message : 'Failed to save edits');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

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
                    <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-md mr-4 overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <Image
                          src={item.images[0]}
                          alt={item.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600">{item.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span className="mr-2">R{item.price}/day</span>
                        <span className="mr-2">•</span>
                        <span>{item.condition}</span>
                        <span className="mr-2">•</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${
                        item.status === 'available'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {item.status === 'available' ? 'Available' : 'Unavailable'}
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItemById(item.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
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

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Item</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (R)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  aria-label="Price"
                  placeholder="Enter price"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  aria-label="Quantity"
                  placeholder="Enter quantity"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  aria-label="Location"
                  placeholder="Enter location"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeEdit}
                disabled={isSaving}
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdits}
                disabled={isSaving}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
