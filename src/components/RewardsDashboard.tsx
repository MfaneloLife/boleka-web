import React, { useState, useEffect } from 'react';
import { 
  TrophyIcon, 
  StarIcon, 
  GiftIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  TicketIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { UserRewards, PointTransaction, Discount } from '@/src/types/rewards';

interface RewardsDashboardProps {
  userId: string;
}

export const RewardsDashboard: React.FC<RewardsDashboardProps> = ({ userId }) => {
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [history, setHistory] = useState<PointTransaction[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRewardsData();
  }, [userId]);

  const loadRewardsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load rewards summary
      const rewardsResponse = await fetch('/api/rewards');
      if (!rewardsResponse.ok) throw new Error('Failed to load rewards');
      const rewardsData = await rewardsResponse.json();
      setRewards(rewardsData.rewards);

      // Load points history
      const historyResponse = await fetch('/api/rewards?type=history&limit=10');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(historyData.history || []);
      }

      // Load discounts
      const discountsResponse = await fetch('/api/rewards?type=discounts');
      if (discountsResponse.ok) {
        const discountsData = await discountsResponse.json();
        setDiscounts(discountsData.discounts || []);
      }

    } catch (err) {
      setError('Failed to load rewards data');
      console.error('Error loading rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  const redeemDiscount = async () => {
    try {
      const pointsCost = 15; // Standard cost for 5% discount
      const discountPercentage = 5;

      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'redeem_discount',
          pointsCost,
          discountPercentage,
          validDays: 30
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to redeem discount');
      }

      const data = await response.json();
      alert(`Discount created! Code: ${data.discount.code}`);
      
      // Reload data
      await loadRewardsData();

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to redeem discount');
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return '💎';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      default: return '🥉';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getPointsColor = (type: string) => {
    switch (type) {
      case 'earned': return 'text-green-600';
      case 'used': return 'text-red-600';
      case 'penalty': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading rewards...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded-md bg-red-50">
        <p className="text-sm text-red-600">{error}</p>
        <button 
          onClick={loadRewardsData}
          className="mt-2 text-sm text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rewards Dashboard</h1>
              <p className="text-gray-600">Track your points, discounts, and achievements</p>
            </div>
          </div>
          
          {rewards && (
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierBadgeColor(rewards.tier)}`}>
                <span className="mr-1">{getTierIcon(rewards.tier)}</span>
                {rewards.tier.charAt(0).toUpperCase() + rewards.tier.slice(1)} Tier
              </div>
            </div>
          )}
        </div>
      </div>

      {rewards && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <StarIcon className="h-8 w-8 text-yellow-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Available Points</p>
                  <p className="text-2xl font-bold text-gray-900">{rewards.availablePoints}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Reliability Score</p>
                  <p className="text-2xl font-bold text-gray-900">{rewards.reliabilityScore}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">On-Time Returns</p>
                  <p className="text-2xl font-bold text-gray-900">{rewards.onTimeReturns}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <GiftIcon className="h-8 w-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Savings</p>
                  <p className="text-2xl font-bold text-gray-900">R{rewards.totalSavings?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Redeem Discount Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Redeem Rewards</h2>
              <span className="text-sm text-gray-500">15 points = 5% discount</span>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">5% Discount Coupon</h3>
                  <p className="text-sm text-gray-600">Valid for 30 days on any rental</p>
                  <p className="text-xs text-gray-500 mt-1">Cost: 15 points</p>
                </div>
                <button
                  onClick={redeemDiscount}
                  disabled={rewards.availablePoints < 15}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Redeem
                </button>
              </div>
            </div>
          </div>

          {/* Active Discounts */}
          {discounts.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <TicketIcon className="h-5 w-5 mr-2" />
                Your Discount Codes
              </h2>
              
              <div className="space-y-3">
                {discounts.map(discount => (
                  <div key={discount.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {discount.code}
                          </code>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            discount.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {discount.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {discount.value}% off • Valid until {formatDate(discount.validUntil)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">{discount.value}% OFF</p>
                        {discount.minimumOrderAmount && (
                          <p className="text-xs text-gray-500">Min order: R{discount.minimumOrderAmount}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points History */}
          {history.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Points Activity</h2>
              
              <div className="space-y-3">
                {history.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <p className="font-medium text-gray-900">{transaction.reason.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getPointsColor(transaction.type)}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {rewards.achievements && rewards.achievements.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Achievements</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.achievements.map((achievement, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🏆</div>
                    <h3 className="font-semibold text-gray-900">{achievement.type.replace('_', ' ')}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(achievement.earnedAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress to Next Tier */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tier Progress</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Current: {rewards.tier}</span>
                <span className="text-sm text-gray-500">{rewards.totalPoints} points</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                  style={{
                    width: `${Math.min(100, (rewards.totalPoints / getNextTierThreshold(rewards.tier)) * 100)}%`
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500">
                <span>Next tier: {getNextTier(rewards.tier)}</span>
                <span>{getNextTierThreshold(rewards.tier) - rewards.totalPoints} points needed</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper functions
function getNextTier(currentTier: string): string {
  switch (currentTier) {
    case 'bronze': return 'silver';
    case 'silver': return 'gold';
    case 'gold': return 'platinum';
    default: return 'platinum';
  }
}

function getNextTierThreshold(currentTier: string): number {
  switch (currentTier) {
    case 'bronze': return 50;
    case 'silver': return 200;
    case 'gold': return 500;
    default: return 500;
  }
}

export default RewardsDashboard;