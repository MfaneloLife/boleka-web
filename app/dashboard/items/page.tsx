'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Plus, Package, Edit, Eye, Trash2, Upload, ImageIcon, X, Loader2, Truck, Hand } from 'lucide-react';

/** Compress an image to max 1920px and ~1MB before upload */
async function compressImage(file: File): Promise<File> {
  // Skip small files or non-images
  if (file.size < 500 * 1024 || !file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 1920;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

interface ItemImage {
  id: string;
  url: string;
  order: number;
}

interface Item {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  status?: string;
  isActive: boolean;
  images: ItemImage[];
  imageUrls: string[];
  imageUrl: string | null;
  createdAt: string;
}

export default function MyShopPage() {
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Auto-open the list form when coming from "List an Item" CTA
  useEffect(() => {
    if (searchParams.get('action') === 'list') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    condition: 'used',
    price: '',
    address: '',
    quantity: '1',
    itemType: 'RENTING' as 'SELLING' | 'RENTING' | 'BOTH',
    rentalPrice: '',
    allowCollection: true,
    allowDelivery: true,
    deliveryFee: '',
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (isLoaded && user) fetchItems();
  }, [isLoaded, user]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items?ownerId=me');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const uploadToR2 = async (files: File[]): Promise<string[]> => {
    setUploadError(null);
    // Compress all images first to stay under Vercel's 4.5MB body limit
    const compressed = await Promise.all(files.map(compressImage));
    const uploads = compressed.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'items');
        const res = await fetch('/api/upload/r2', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          return data.url as string;
        } else {
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          setUploadError(`${file.name}: ${errData.error || errData.detail || `HTTP ${res.status}`}`);
          return null;
        }
      } catch (err: any) {
        setUploadError(`${file.name}: Network error — ${err?.message || 'check your connection'}`);
        return null;
      }
    });
    const results = await Promise.all(uploads);
    return results.filter((url): url is string => url !== null);
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = selectedFiles.length + uploadedUrls.length + files.length;
    if (total > 6) { setUploadError('Maximum 6 images allowed'); return; }
    setUploadError(null);
    setSelectedFiles(prev => [...prev, ...files].slice(0, 6));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setUploadError(null);

    if (!formData.title || !formData.price) {
      setFormError('Title and price are required.');
      return;
    }

    if (formData.itemType === 'BOTH' && !formData.rentalPrice) {
      setFormError('Both selling price and rental price are required for "Both" listings.');
      return;
    }

    setUploading(true);
    try {
      let imageUrls: string[] = [...uploadedUrls];
      if (selectedFiles.length > 0) {
        const newUrls = await uploadToR2(selectedFiles);
        imageUrls = [...imageUrls, ...newUrls];
      }

      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10) || 1,
        itemType: formData.itemType,
        address: formData.address,
        allowCollection: formData.allowCollection,
        allowDelivery: formData.allowDelivery,
        deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : 0,
        images: imageUrls,
      };

      if (formData.itemType === 'BOTH' || formData.itemType === 'RENTING') {
        if (formData.itemType === 'BOTH') {
          payload.rentalPrice = parseFloat(formData.rentalPrice);
        } else if (formData.rentalPrice) {
          payload.rentalPrice = parseFloat(formData.rentalPrice);
        }
      }

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = 'Failed to create item. Please try again.';
        try { const json = JSON.parse(errText); errMsg = json.error || errMsg; } catch {}
        throw new Error(errMsg);
      }

      setFormData({
        title: '', description: '', category: 'other', condition: 'used',
        price: '', address: '', quantity: '1', itemType: 'RENTING',
        rentalPrice: '', allowCollection: true, allowDelivery: true, deliveryFee: '',
      });
      setSelectedFiles([]);
      setUploadedUrls([]);
      setShowAddForm(false);
      setFormSuccess('Item listed successfully! 🎉');
      setTimeout(() => setFormSuccess(null), 4000);
      fetchItems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create item. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;
    
    setDeleting(itemId);
    try {
      const res = await fetch(`/api/items?id=${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      alert('Failed to delete item. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shop</h1>
          <p className="text-gray-500 text-sm mt-1">
            {items.length > 0 ? `You have ${items.length} item${items.length > 1 ? 's' : ''} listed` : 'Start listing items to rent.'}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {/* Success banner */}
      {formSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <span className="text-lg">🎉</span> {formSuccess}
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <form onSubmit={handleCreateItem} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">List a New Item</h2>

          {/* Form errors */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm">
              {formError}
            </div>
          )}
          {uploadError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm">
              {uploadError}
            </div>
          )}

          {/* Image Upload */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Images (max 6)</p>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(i)} className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {uploadedUrls.map((url, i) => (
                <div key={`url-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(selectedFiles.length + i)} className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {selectedFiles.length + uploadedUrls.length < 6 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-orange-400 transition">
                  <Upload className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesSelected} className="hidden" />
          </div>

          {/* Item type */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Item type</label>
            <div className="flex gap-2 mt-1.5">
              {(['RENTING', 'SELLING', 'BOTH'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, itemType: type }))}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    formData.itemType === type
                      ? 'bg-orange-50 border-orange-400 text-orange-600'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {type === 'RENTING' ? 'Rent' : type === 'SELLING' ? 'Sell' : 'Both'}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700">Title <span className="text-red-500">*</span></label>
              <input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors" placeholder="e.g. DSLR Camera" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Category</label>
              <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors">
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))
                ) : (
                  <>
                    <option value="electronics">Electronics</option>
                    <option value="home">Home & Garden</option>
                    <option value="fashion">Fashion</option>
                    <option value="sports">Sports & Leisure</option>
                    <option value="vehicles">Vehicles</option>
                    <option value="beauty">Beauty</option>
                    <option value="event-catering">Event & Catering</option>
                    <option value="sport-kit">Sport Kit</option>
                    <option value="other">Other</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">
                {formData.itemType === 'SELLING' ? 'Price (R)' : formData.itemType === 'BOTH' ? 'Selling Price (R)' : 'Rental price (R/day)'} <span className="text-red-500">*</span>
              </label>
              <input type="number" step="0.01" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors" placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Condition</label>
              <select value={formData.condition} onChange={e => setFormData(p => ({ ...p, condition: e.target.value }))} className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors">
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="used">Used</option>
                <option value="fair">Fair</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Quantity</label>
              <input type="number" min="1" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors" placeholder="1" />
            </div>
            {formData.itemType === 'BOTH' && (
              <div>
                <label className="text-sm font-semibold text-gray-700">Rental price (R/day) <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" value={formData.rentalPrice} onChange={e => setFormData(p => ({ ...p, rentalPrice: e.target.value }))} className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors" placeholder="0" />
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors" placeholder="Describe your item..." />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Location / Address</label>
            <input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors" placeholder="e.g. Sandton, Johannesburg" />
          </div>

          {/* Delivery options */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery & Collection</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowCollection}
                  onChange={e => setFormData(p => ({ ...p, allowCollection: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
                <Hand className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Allow collection</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowDelivery}
                  onChange={e => setFormData(p => ({ ...p, allowDelivery: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
                <Truck className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Allow delivery</span>
              </label>
            </div>
            {formData.allowDelivery && (
              <div>
                <label className="text-xs font-medium text-gray-600">Delivery fee (R)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.deliveryFee}
                  onChange={e => setFormData(p => ({ ...p, deliveryFee: e.target.value }))}
                  className="w-full mt-1 px-4 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          <button type="submit" disabled={uploading || !formData.title || !formData.price} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'List Item'}
          </button>
        </form>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
          <p className="text-gray-400 text-sm">Loading your items...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={fetchItems} className="mt-4 text-sm font-medium text-orange-600 hover:text-orange-700">Try again</button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No items yet</h2>
          <p className="text-sm text-gray-500 mb-6">List your first item to start renting</p>
          <button onClick={() => setShowAddForm(true)} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition shadow-sm">
            <Plus className="w-4 h-4" />
            List your first item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-gray-100 relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : item.imageUrls?.[0] ? (
                  <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full"><ImageIcon className="w-8 h-8 text-gray-300" /></div>
                )}
                <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${item.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">R{item.price.toFixed(2)}/day &middot; {item.category}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Link href={`/items/${item.id}`} className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 py-1.5 rounded-lg transition">
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  <Link href={`/dashboard/items/${item.id}`} className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 py-1.5 rounded-lg transition">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deleting === item.id}
                    className="flex items-center justify-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 py-1.5 px-2 rounded-lg transition disabled:opacity-50"
                  >
                    {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}