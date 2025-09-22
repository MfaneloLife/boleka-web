import { Timestamp } from 'firebase/firestore';

export interface Achievement {
  type: string;
  earnedAt: Timestamp;
  description: string;
}

export interface UserRewards {
  userId: string;
  email: string;
  name: string;
  
  // Points System
  totalPoints: number;
  availablePoints: number; // Total minus redeemed
  redeemedPoints: number;
  pendingPoints: number; // Points from recent returns not yet confirmed
  usedPoints: number; // Track points used for discounts
  
  // Streaks and Performance
  onTimeReturnStreak: number;
  maxStreak: number;
  totalRentals: number;
  onTimeReturns: number;
  lateReturns: number;
  streakDays: number;
  longestStreak: number;
  reliabilityScore: number;
  
  // Reward Level and Tier
  rewardLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  pointsToNextLevel: number;
  
  // Discounts and Benefits
  activeDiscounts: Discount[];
  lifetimeDiscountsUsed: number;
  discountsUsed: number;
  discountsEarned: number; // Add this missing field
  totalSavingsAmount: number;
  totalSavings: number;
  
  // Achievements
  achievements: Achievement[]; // Change from string[] to Achievement[]
  pointsHistory: PointTransaction[]; // Add this missing field
  
  // Recent Activity
  recentTransactions: PointTransaction[];
  lastActivityDate: Timestamp; // Add this missing field
  
  updatedAt: Timestamp;
}

export interface PointTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'penalty' | 'used';
  points: number;
  reason: string;
  description: string;
  
  // Related entities
  orderId?: string;
  agreementId?: string;
  discountId?: string;
  
  // Metadata for additional context
  metadata?: {
    orderId?: string;
    savingsAmount?: number;
    [key: string]: any;
  };
  
  // Transaction details
  balanceBefore: number;
  balanceAfter: number;
  expiresAt?: Timestamp;
  
  createdAt: Timestamp;
  processedAt?: Timestamp;
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
}

export interface Discount {
  id: string;
  userId: string;
  
  // Discount Details
  code: string; // Unique discount code
  type: 'percentage' | 'fixed_amount';
  value: number; // Percentage (5) or fixed amount (10.00)
  description: string;
  
  // Redemption Requirements
  pointsCost: number;
  minimumOrderAmount?: number;
  applicableCategories?: string[];
  excludedCategories?: string[];
  
  // Validity
  validFrom: Timestamp;
  validUntil: Timestamp;
  maxUses: number;
  usedCount: number;
  usageCount: number; // Add alias for usedCount
  usageLimit: number; // Add alias for maxUses
  
  // Status
  status: 'active' | 'used' | 'expired' | 'cancelled';
  isActive: boolean; // Add boolean status field
  isUsed: boolean; // Add boolean used field
  
  // Metadata
  generatedFrom: 'points_redemption' | 'streak_bonus' | 'special_offer' | 'admin_grant';
  orderId?: string; // If used in an order
  
  createdAt: Timestamp;
  usedAt?: Timestamp;
}

export interface RewardRule {
  id: string;
  name: string;
  description: string;
  
  // Trigger Conditions
  eventType: 'on_time_return' | 'first_rental' | 'streak_milestone' | 'rating_received' | 'review_left';
  conditions: {
    streakCount?: number;
    rating?: number;
    orderAmount?: number;
    category?: string;
  };
  
  // Reward
  pointsAwarded: number;
  bonusMultiplier?: number;
  specialDiscount?: {
    type: 'percentage' | 'fixed_amount';
    value: number;
    validDays: number;
  };
  
  // Limits
  maxUsesPerUser?: number;
  maxUsesTotal?: number;
  currentUses: number;
  
  // Validity
  isActive: boolean;
  validFrom: Timestamp;
  validUntil?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RewardLevel {
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  minPoints: number;
  maxPoints?: number;
  benefits: {
    pointsMultiplier: number; // 1.0 = normal, 1.2 = 20% bonus
    prioritySupport: boolean;
    extendedReturnWindow: number; // Extra hours
    freeLateForgiveness: number; // Times per month
    specialDiscounts: boolean;
  };
  badgeUrl: string;
  description: string;
}

// Constants
export const REWARD_LEVELS: RewardLevel[] = [
  {
    level: 'Bronze',
    minPoints: 0,
    maxPoints: 99,
    benefits: {
      pointsMultiplier: 1.0,
      prioritySupport: false,
      extendedReturnWindow: 0,
      freeLateForgiveness: 0,
      specialDiscounts: false,
    },
    badgeUrl: '/images/badges/bronze.png',
    description: 'New member - start earning points!'
  },
  {
    level: 'Silver',
    minPoints: 100,
    maxPoints: 299,
    benefits: {
      pointsMultiplier: 1.1,
      prioritySupport: false,
      extendedReturnWindow: 2,
      freeLateForgiveness: 1,
      specialDiscounts: false,
    },
    badgeUrl: '/images/badges/silver.png',
    description: 'Reliable renter - 10% bonus points!'
  },
  {
    level: 'Gold',
    minPoints: 300,
    maxPoints: 599,
    benefits: {
      pointsMultiplier: 1.25,
      prioritySupport: true,
      extendedReturnWindow: 4,
      freeLateForgiveness: 2,
      specialDiscounts: true,
    },
    badgeUrl: '/images/badges/gold.png',
    description: 'Trusted member - priority support & bonuses!'
  },
  {
    level: 'Platinum',
    minPoints: 600,
    benefits: {
      pointsMultiplier: 1.5,
      prioritySupport: true,
      extendedReturnWindow: 6,
      freeLateForgiveness: 3,
      specialDiscounts: true,
    },
    badgeUrl: '/images/badges/platinum.png',
    description: 'Elite member - maximum benefits!'
  }
];

export const POINTS_FOR_ON_TIME_RETURN = 10;
export const POINTS_FOR_DISCOUNT = 15; // 15 points = 5% discount
export const STREAK_BONUS_THRESHOLD = 5; // Bonus every 5 consecutive on-time returns

// Helper functions
export const calculateUserLevel = (totalPoints: number): RewardLevel => {
  for (let i = REWARD_LEVELS.length - 1; i >= 0; i--) {
    const level = REWARD_LEVELS[i];
    if (totalPoints >= level.minPoints) {
      return level;
    }
  }
  return REWARD_LEVELS[0]; // Default to Bronze
};

export const getPointsToNextLevel = (totalPoints: number): number => {
  const currentLevel = calculateUserLevel(totalPoints);
  const nextLevelIndex = REWARD_LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  
  if (nextLevelIndex >= REWARD_LEVELS.length) {
    return 0; // Already at max level
  }
  
  const nextLevel = REWARD_LEVELS[nextLevelIndex];
  return nextLevel.minPoints - totalPoints;
};

export const calculateDiscountAmount = (
  discount: Discount,
  orderAmount: number
): number => {
  if (discount.minimumOrderAmount && orderAmount < discount.minimumOrderAmount) {
    return 0;
  }
  
  if (discount.type === 'percentage') {
    return orderAmount * (discount.value / 100);
  } else {
    return Math.min(discount.value, orderAmount);
  }
};

export const formatPoints = (points: number): string => {
  return `${points} point${points !== 1 ? 's' : ''}`;
};

export const formatDiscount = (discount: Discount): string => {
  if (discount.type === 'percentage') {
    return `${discount.value}% off`;
  } else {
    return `R${discount.value.toFixed(2)} off`;
  }
};

export const canRedeemDiscount = (
  userRewards: UserRewards,
  pointsCost: number
): boolean => {
  return userRewards.availablePoints >= pointsCost;
};

export const getNextRewardMilestone = (userRewards: UserRewards): { pointsNeeded: number; nextLevel: string } => {
  const currentPoints = userRewards.totalPoints;
  
  if (currentPoints < 100) {
    return { pointsNeeded: 100 - currentPoints, nextLevel: 'Silver' };
  } else if (currentPoints < 500) {
    return { pointsNeeded: 500 - currentPoints, nextLevel: 'Gold' };
  } else if (currentPoints < 1000) {
    return { pointsNeeded: 1000 - currentPoints, nextLevel: 'Platinum' };
  } else {
    return { pointsNeeded: 0, nextLevel: 'Platinum' };
  }
};

export const isEligibleForDiscount = (
  userRewards: UserRewards,
  discount: Discount
): boolean => {
  return userRewards.availablePoints >= discount.pointsCost &&
         discount.status === 'active' &&
         discount.validUntil.toDate() > new Date();
};

export const calculateStreakBonus = (streak: number): number => {
  if (streak < STREAK_BONUS_THRESHOLD) return 0;
  
  const bonusMultiplier = Math.floor(streak / STREAK_BONUS_THRESHOLD);
  return bonusMultiplier * 5; // 5 bonus points for every 5 consecutive returns
};