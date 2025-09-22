'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ItemCard from '@/components/ItemCard';
import SearchFilters from '@/components/search/SearchFilters';

interface Item {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  status: 'available' | 'rented' | 'maintenance';
  ownerId: string;
  ownerLocation?: {
    province?: string;
    city?: string;
    suburb?: string;
  };
  createdAt: any;
  updatedAt: any;
}

interface Category {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Public fetch of items, categories, and locations
    Promise.all([
      fetch('/api/items').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/locations').then(res => res.json())
    ])
      .then(([itemsResponse, categoriesData, locationsData]) => {
        const itemsData = itemsResponse.items || [];
        setItems(itemsData);
        setFilteredItems(itemsData);
        setCategories(categoriesData);
        setLocations(locationsData);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setIsLoading(false);
      });
  }, [router]);

  const handleFilterChange = (filters: {
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  }) => {
    let filtered = [...items];

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // Apply location filter based on owner location
    if (filters.location) {
      filtered = filtered.filter(item => {
        if (!item.ownerLocation) return false;
        
        const location = filters.location!.toLowerCase();
        const matchesProvince = item.ownerLocation.province?.toLowerCase().replace(/\s+/g, '-') === location;
        const matchesCity = item.ownerLocation.city?.toLowerCase().replace(/\s+/g, '-') === location;
        
        return matchesProvince || matchesCity;
      });
    }

    // Apply price filter
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(item => item.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(item => item.price <= filters.maxPrice!);
    }

    // Only show available items
    filtered = filtered.filter(item => item.status === 'available');

    // Apply search term if any
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term)) ||
          item.category.toLowerCase().includes(term) ||
          item.condition.toLowerCase().includes(term) ||
          (item.ownerLocation?.province && item.ownerLocation.province.toLowerCase().includes(term)) ||
          (item.ownerLocation?.city && item.ownerLocation.city.toLowerCase().includes(term))
      );
    }

    setFilteredItems(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({});
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Search Items</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Find what you need with our advanced search options
        </p>
      </div>

      <div className="mt-4">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex">
            <input
              type="text"
              placeholder="Search for items..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-r-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Search
            </button>
          </div>
        </form>

        <SearchFilters
          categories={categories}
          locations={locations}
          onFilterChange={handleFilterChange}
        />

        <div className="mt-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-md shadow">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 mb-4">
                No items found matching your search criteria.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  handleFilterChange({});
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  name={item.title}
                  description={item.description || ''}
                  price={item.price}
                  images={item.images || []}
                  category={item.category}
                  location={item.ownerLocation ? 
                    `${item.ownerLocation.city}${item.ownerLocation.province ? `, ${item.ownerLocation.province}` : ''}` : 
                    item.condition
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
