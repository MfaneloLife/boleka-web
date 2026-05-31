'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Save, Trash2, Upload, X, Loader2, Package, Hand, Truck, ImageIcon } from 'lucide-react';

interface ItemImage {
  id: string;
  url: string;
  order: number;
}

interface ItemData {
  id: string;
  title: string;
  description: string | null;
  price: number;
  rentalPrice?: number | null;
  category: string;
  condition: string;
  quantity: number;
  isActive: boolean;
  itemType?: string;
  address: string | null;
  location?: string | null;
  allowCollection: boolean;
  allowDelivery: boolean;
  deliveryFee: number;
  imageUrls: string[];
  images: ItemImage[];
  ownerId: string;
}

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;
  const { user, isLoaded } = useUser();

  const [item, setItem] = useState<ItemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notOwner, setNotOwner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    condition: 'used',
    price: '',
    quantity: '1',
    itemType: 'RENTING' as 'SELLING' | 'RENTING' | 'BOTH',
    rentalPrice: '',
    address: '',
    allowCollection: true,
    allowDelivery: true,
    deliveryFee: '',
    isActive: true,
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Fetch item data
  useEffect(() => {
    if (!itemId) return;
    setIsLoading(true);
    fetch(`/api/items/${itemId}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); return null; }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        if (isLoaded && user && data.ownerId !== user.id) {
          setNotOwner(true);
          return;
        }
        setItem(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'other',
          condition: data.condition || 'used',
          price: data.price?.toString() || '',
          quantity: (data.quantity || 1).toString(),
          itemType: data.itemType || 'RENTING',
          rentalPrice: data.rentalPrice?.toString() || '',
          address: data.address || data.location || '',
          allowCollection: data.allowCollection !== false,
          allowDelivery: data.allowDelivery !== false,
          deliveryFee: (data.deliveryFee || 0).toString(),
          isActive: data.isActive !== false,
        });
        const urls = data.imageUrls || [];
        setExistingUrls(urls);
      })
      .catch(() => setError('Failed to load item'))
      .finally(() => setIsLoading(false));
  }, [itemId, isLoaded, user]);

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  const uploadToR2 = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    setUploadError(null);
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'items');
        const res = await fetch('/api/upload/r2', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          urls.push(data.url);
        } else {
          setUploadError(`Failed to upload ${file.name}. Skipping.`);
        }
      } catch {
        setUploadError(`Network error uploading ${file.name}. Skipping.`);
      }
    }
    return urls;
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = selectedFiles.length + existingUrls.length + files.length;
    if (total > 6) { setUploadError('Maximum 6 images allowed'); return; }
    setUploadError(null);
    setSelectedFiles(prev => [...prev, ...files].slice(0, 6));
  };

  const removeExistingImage = (index: number) => {
    setExistingUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);

    if (!formData.title || !formData.price) {
      setError('Title and price are required.');
      return;
    }

    setSaving(true);
    try {
      let allUrls = [...existingUrls];
      if (selectedFiles.length > 0) {
        setUploadingImages(true);
        const newUrls = await uploadToR2(selectedFiles);
        allUrls = [...allUrls, ...newUrls];
        setUploadingImages(false);
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
        isActive: formData.isActive,
        images: allUrls,
      };

      if (formData.itemType !== 'SELLING' && formData.rentalPrice) {
        payload.rentalPrice = parseFloat(formData.rentalPrice);
      }

      const res = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = 'Failed to save changes.';
        try { const json = JSON.parse(errText); errMsg = json.error || errMsg; } catch {}
        throw new Error(errMsg);
      }

      const updated = await res.json();
      setExistingUrls(updated.imageUrls || allUrls);
      setSelectedFiles([]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/dashboard/items');
    } catch {
      alert('Failed to delete item. Please try again.');
      setDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
        <p className="text-gray-400 text-sm">Loading item...</p>
      </div>
    );
  }

  // Not found / not owner
  if (notFound) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">Item not found</p>
        <Link href="/dashboard/items" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700">&larr; Back to My Shop</Link>
      </div>
    );
  }

  if (notOwner) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">You don't own this item.</p>
        <Link href="/dashboard/items" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700">&larr; Back to My Shop</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/items" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to My Shop
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Item</h1>
          <p className="text-gray-500 text-sm mt-1">Update your item details</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? 'Saved!' : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <span className="text-lg">✅</span> Item updated successfully!
        </div>
      )}
      {uploadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">{uploadError}</div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
        {/* Images */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Images (max 6)</p>
          <div className="flex flex-wrap gap-2">
            {/* Existing images */}
            {existingUrls.map((url, i) => (
              <div key={`existing-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {/* New files */}
            {selectedFiles.map((file, i) => (
              <div key={`new-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNewFile(i)} className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {/* Empty placeholder */}
            {existingUrls.length === 0 && selectedFiles.length === 0 && (
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-gray-300" />
              </div>
            )}
            {/* Add button */}
            {existingUrls.length + selectedFiles.length < 6 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-orange-400 transition">
                <Upload className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesSelected} className="hidden" />
        </div>

        {/* Item Type */}
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

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
          />
          <span className="text-sm text-gray-700">Item is active (visible to buyers)</span>
        </label>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Title *</label>
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
                  <option value="other">Other</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Price {formData.itemType === 'SELLING' ? '(R)' : '(R/day)'} *
            </label>
            <input type="number" step="0.01" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors" placeholder="150" />
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
          {formData.itemType !== 'SELLING' && (
            <div>
              <label className="text-sm font-semibold text-gray-700">Rental price (R/day)</label>
              <input type="number" step="0.01" value={formData.rentalPrice} onChange={e => setFormData(p => ({ ...p, rentalPrice: e.target.value }))} className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors" placeholder="Separate rental rate (optional)" />
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-gray-700">Description</label>
          <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={4} className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors" placeholder="Describe your item..." />
        </div>

        {/* Location */}
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
      </form>
    </div>
  );
}