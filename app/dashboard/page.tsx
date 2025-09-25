'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  ClockIcon,
  CubeIcon,
  ChartBarIcon,
  UsersIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  imageUrl?: string;
  category: string;
}

interface QuickStats {
  totalItems: number;
  totalRequests: number;
  totalEarnings: number;
  activeRentals: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [featuredItems, setFeaturedItems] = useState<Item[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalItems: 0,
    totalRequests: 0,
    totalEarnings: 0,
    activeRentals: 0
  });

  useEffect(() => {
    // Fetch public dashboard data; auth-protected API routes may require NextAuth session,
    // so wrap those fetches with try/catch
    Promise.all([
      fetch('/api/items/featured').then(res => res.json()).catch(() => ({ items: [] })),
      fetch('/api/dashboard/stats').then(res => res.json()).catch(() => quickStats)
    ])
      .then(([itemsData, statsData]) => {
        setFeaturedItems(itemsData.items || []);
        setQuickStats(statsData || quickStats);
      })
      .catch(err => {
        console.error('Error fetching dashboard data:', err);
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    
    router.push(`/dashboard/client/search?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Find what you need or share what you have
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            What are you looking for?
          </h2>
          <p className="text-gray-600">
            Search thousands of items available for rent in your area
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for tools, equipment, vehicles..."
                className="w-full pl-12 pr-4 py-3 md:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base md:text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            
            {/* Location Input */}
            <div className="md:w-64 relative">
              <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Location"
                className="w-full pl-12 pr-4 py-3 md:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base md:text-lg"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            
            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="px-5 md:px-8 py-3 md:py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-semibold text-base md:text-lg flex items-center justify-center"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Search
            </button>
          </div>
        </div>

        {/* Quick Categories */}
        <div className="mt-8">
          <p className="text-center text-gray-600 mb-4">Popular categories:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Tools', 'Equipment', 'Vehicles', 'Electronics', 'Sports', 'Garden'].map((category) => (
              <Link
                key={category}
                href={`/dashboard/client/search?category=${category.toLowerCase()}`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-orange-100 hover:text-orange-700 transition-colors"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CubeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Items</p>
              <p className="text-2xl font-bold text-gray-900">{quickStats.totalItems}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Rentals</p>
              <p className="text-2xl font-bold text-gray-900">{quickStats.activeRentals}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{quickStats.totalRequests}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">R{quickStats.totalEarnings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards removed as per request: moved to sidebar */}

      {/* Featured Items */}
      {featuredItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Items</h2>
            <Link
              href="/dashboard/client/search"
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredItems.slice(0, 4).map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <CubeIcon className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-600">R{item.price}/day</span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {item.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
