'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FilterOption {
  id: string;
  name: string;
}

interface SearchFiltersProps {
  categories: FilterOption[];
  locations: FilterOption[];
  onFilterChange: (filters: {
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  }) => void;
}

export default function SearchFilters({
  categories,
  locations,
  onFilterChange,
}: SearchFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedCategory(category);
    applyFilters({ category });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const location = e.target.value;
    setSelectedLocation(location);
    applyFilters({ location });
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = parseInt(e.target.value, 10) || 0;
    setPriceRange([min, priceRange[1]]);
    applyFilters({ minPrice: min });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = parseInt(e.target.value, 10) || 1000;
    setPriceRange([priceRange[0], max]);
    applyFilters({ maxPrice: max });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rating = parseInt(e.target.value, 10);
    setMinRating(rating);
    applyFilters({ minRating: rating });
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedLocation('');
    setPriceRange([0, 1000]);
    setMinRating(0);
    
    onFilterChange({});
  };

  const applyFilters = (changedFilter: {
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  }) => {
    onFilterChange({
      category: changedFilter.category !== undefined ? changedFilter.category : selectedCategory,
      location: changedFilter.location !== undefined ? changedFilter.location : selectedLocation,
      minPrice: changedFilter.minPrice !== undefined ? changedFilter.minPrice : priceRange[0],
      maxPrice: changedFilter.maxPrice !== undefined ? changedFilter.maxPrice : priceRange[1],
      minRating: changedFilter.minRating !== undefined ? changedFilter.minRating : minRating,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-orange-600 hover:text-orange-800 flex items-center text-sm font-medium"
        >
          {isExpanded ? 'Collapse' : 'Expand'} Filters
          <ChevronDownIcon
            className={`ml-1 h-5 w-5 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <div className={`mt-4 space-y-4 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-orange-500 focus:outline-none focus:ring-orange-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              id="location"
              value={selectedLocation}
              onChange={handleLocationChange}
              className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-orange-500 focus:outline-none focus:ring-orange-500"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Range ($ per day)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  min="0"
                  value={priceRange[0]}
                  onChange={handleMinPriceChange}
                  placeholder="Min"
                  className="w-full rounded-md border border-gray-300 py-2 px-3 text-base focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  min={priceRange[0]}
                  value={priceRange[1]}
                  onChange={handleMaxPriceChange}
                  placeholder="Max"
                  className="w-full rounded-md border border-gray-300 py-2 px-3 text-base focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Rating
            </label>
            <select
              id="rating"
              value={minRating}
              onChange={handleRatingChange}
              className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-orange-500 focus:outline-none focus:ring-orange-500"
            >
              <option value="0">Any Rating</option>
              <option value="1">1+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={resetFilters}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
