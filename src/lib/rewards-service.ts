import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  UserRewards, 
  PointTransaction, 
  Discount,
  calculateDiscountAmount,
  getNextRewardMilestone,
  isEligibleForDiscount
} from '@/src/types/rewards';

export class RewardsService {
  private static readonly REWARDS_COLLECTION = 'user_rewards';
  private static readonly TRANSACTIONS_COLLECTION = 'point_transactions';
  private static readonly DISCOUNTS_COLLECTION = 'discounts';

  // Points Management
  static async getUserRewards(userId: string): Promise<UserRewards | null> {
    try {
      const docRef = doc(db, this.REWARDS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { userId, ...docSnap.data() } as UserRewards;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user rewards:', error);
      throw error;
    }
  }

  static async initializeUserRewards(userId: string): Promise<UserRewards> {
    try {
      const initialRewards: any = {
        userId,
        email: '',
        name: '',
        totalPoints: 0,
        availablePoints: 0,
        redeemedPoints: 0,
        pendingPoints: 0,
        usedPoints: 0,
        onTimeReturnStreak: 0,
        maxStreak: 0,
        totalRentals: 0,
        onTimeReturns: 0,
        lateReturns: 0,
        reliabilityScore: 100,
        rewardLevel: 'Bronze',
        tier: 'Bronze',
        pointsToNextLevel: 100,
        activeDiscounts: [],
        lifetimeDiscountsUsed: 0,
        discountsUsed: 0,
        discountsEarned: 0,
        totalSavingsAmount: 0,
        totalSavings: 0,
        achievements: [],
        pointsHistory: [],
        recentTransactions: [],
        streakDays: 0,
        longestStreak: 0,
        lastActivityDate: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = doc(db, this.REWARDS_COLLECTION, userId);
      await updateDoc(docRef, initialRewards as any); // Type assertion for Firestore
      
      return initialRewards;
    } catch (error) {
      console.error('Error initializing user rewards:', error);
      throw error;
    }
  }

  static async awardPoints(
    userId: string,
    points: number,
    reason: PointTransaction['reason'],
    metadata?: Record<string, any>
  ): Promise<PointTransaction> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Get or create user rewards
        const rewardsRef = doc(db, this.REWARDS_COLLECTION, userId);
        const rewardsDoc = await transaction.get(rewardsRef);
        
        let userRewards: UserRewards;
        if (!rewardsDoc.exists()) {
          userRewards = await this.initializeUserRewards(userId);
        } else {
          userRewards = { userId, ...rewardsDoc.data() } as UserRewards;
        }

        // Create point transaction
        const pointTransaction: Omit<PointTransaction, 'id'> = {
          userId,
          points,
          type: 'earned',
          reason,
          description: reason,
          status: 'confirmed',
          balanceBefore: userRewards.totalPoints,
          balanceAfter: userRewards.totalPoints + points,
          metadata,
          createdAt: Timestamp.now()
        };

        const transactionRef = doc(collection(db, this.TRANSACTIONS_COLLECTION));
        transaction.set(transactionRef, pointTransaction);

        // Update user rewards
        const newTotalPoints = userRewards.totalPoints + points;
        const newAvailablePoints = userRewards.availablePoints + points;
        
        // Check for tier upgrade
        const newTier = this.calculateTier(newTotalPoints);
        const tierUpgraded = newTier !== userRewards.tier;

        // Update rewards data
        const updatedRewards: any = {
          totalPoints: newTotalPoints,
          availablePoints: newAvailablePoints,
          tier: newTier,
          lastActivityDate: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        // Update specific stats based on reason
        if (reason === 'on_time_return') {
          updatedRewards.onTimeReturns = (userRewards.onTimeReturns || 0) + 1;
          updatedRewards.totalRentals = (userRewards.totalRentals || 0) + 1;
          updatedRewards.streakDays = (userRewards.streakDays || 0) + 1;
          updatedRewards.longestStreak = Math.max(
            userRewards.longestStreak || 0, 
            updatedRewards.streakDays
          );
          updatedRewards.reliabilityScore = this.calculateReliabilityScore(
            updatedRewards.onTimeReturns,
            userRewards.lateReturns || 0
          );
        } else if (reason === 'bonus_points') {
          // Add to achievements if it's a special milestone
          if (metadata?.achievement) {
            const achievements = [...(userRewards.achievements || [])];
            if (!achievements.some(a => a.type === metadata.achievement)) {
              achievements.push({
                type: metadata.achievement,
                earnedAt: Timestamp.now(),
                description: metadata.achievementDescription || `Earned ${points} bonus points`
              });
              updatedRewards.achievements = achievements;
            }
          }
        }

        // Add tier upgrade achievement
        if (tierUpgraded) {
          const achievements = [...(userRewards.achievements || [])];
          achievements.push({
            type: 'tier_upgrade',
            earnedAt: Timestamp.now(),
            description: `Upgraded to ${newTier} tier`
          });
          updatedRewards.achievements = achievements;
        }

        transaction.update(rewardsRef, updatedRewards);

        return {
          id: transactionRef.id,
          ...pointTransaction
        } as PointTransaction;
      });
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  static async deductPoints(
    userId: string,
    points: number,
    reason: PointTransaction['reason'],
    metadata?: Record<string, any>
  ): Promise<PointTransaction> {
    try {
      return await runTransaction(db, async (transaction) => {
        const rewardsRef = doc(db, this.REWARDS_COLLECTION, userId);
        const rewardsDoc = await transaction.get(rewardsRef);
        
        if (!rewardsDoc.exists()) {
          throw new Error('User rewards not found');
        }
        
        const userRewards = { userId, ...rewardsDoc.data() } as UserRewards;
        
        if (userRewards.availablePoints < points) {
          throw new Error('Insufficient points');
        }

        // Create point transaction
        const pointTransaction: Omit<PointTransaction, 'id'> = {
          userId,
          points: -points,
          type: 'used',
          reason,
          description: reason,
          status: 'confirmed',
          balanceBefore: userRewards.availablePoints,
          balanceAfter: userRewards.availablePoints - points,
          metadata,
          createdAt: Timestamp.now()
        };

        const transactionRef = doc(collection(db, this.TRANSACTIONS_COLLECTION));
        transaction.set(transactionRef, pointTransaction);

        // Update user rewards
        const updatedRewards: Partial<UserRewards> = {
          availablePoints: userRewards.availablePoints - points,
          usedPoints: (userRewards.usedPoints || 0) + points,
          lastActivityDate: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        if (reason === 'discount_redemption') {
          updatedRewards.discountsUsed = (userRewards.discountsUsed || 0) + 1;
          if (metadata?.savingsAmount) {
            updatedRewards.totalSavings = (userRewards.totalSavings || 0) + metadata.savingsAmount;
          }
        }

        transaction.update(rewardsRef, updatedRewards);

        return {
          id: transactionRef.id,
          ...pointTransaction
        } as PointTransaction;
      });
    } catch (error) {
      console.error('Error deducting points:', error);
      throw error;
    }
  }

  static async recordLateReturn(userId: string, orderId: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const rewardsRef = doc(db, this.REWARDS_COLLECTION, userId);
        const rewardsDoc = await transaction.get(rewardsRef);
        
        let userRewards: UserRewards;
        if (!rewardsDoc.exists()) {
          userRewards = await this.initializeUserRewards(userId);
        } else {
          userRewards = { userId, ...rewardsDoc.data() } as UserRewards;
        }

        // Reset streak and update stats
        const updatedRewards: Partial<UserRewards> = {
          lateReturns: (userRewards.lateReturns || 0) + 1,
          totalRentals: (userRewards.totalRentals || 0) + 1,
          streakDays: 0, // Reset streak
          reliabilityScore: this.calculateReliabilityScore(
            userRewards.onTimeReturns || 0,
            (userRewards.lateReturns || 0) + 1
          ),
          lastActivityDate: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        // Create negative point transaction if applicable
        const penaltyPoints = this.calculateLatePenalty(userRewards.tier);
        if (penaltyPoints > 0) {
          const pointTransaction: Omit<PointTransaction, 'id'> = {
            userId,
            points: -penaltyPoints,
            type: 'penalty',
            reason: 'late_return',
            description: 'Late return penalty',
            status: 'confirmed',
            balanceBefore: userRewards.totalPoints,
            balanceAfter: userRewards.totalPoints - penaltyPoints,
            metadata: { orderId },
            createdAt: Timestamp.now()
          };

          const transactionRef = doc(collection(db, this.TRANSACTIONS_COLLECTION));
          transaction.set(transactionRef, pointTransaction);

          updatedRewards.availablePoints = Math.max(
            0, 
            (userRewards.availablePoints || 0) - penaltyPoints
          );
        }

        transaction.update(rewardsRef, updatedRewards);
      });
    } catch (error) {
      console.error('Error recording late return:', error);
      throw error;
    }
  }

  // Discount Management
  static async createDiscount(
    userId: string,
    pointsCost: number,
    discountPercentage: number,
    validUntil: Date
  ): Promise<Discount> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Check if user has enough points
        const rewardsRef = doc(db, this.REWARDS_COLLECTION, userId);
        const rewardsDoc = await transaction.get(rewardsRef);
        
        if (!rewardsDoc.exists()) {
          throw new Error('User rewards not found');
        }
        
        const userRewards = { userId, ...rewardsDoc.data() } as UserRewards;
        
        if (userRewards.availablePoints < pointsCost) {
          throw new Error('Not eligible for discount');
        }

        // Create discount code
        const discountCode = this.generateDiscountCode();
        
        const discount: Omit<Discount, 'id'> = {
          userId,
          code: discountCode,
          type: 'percentage',
          value: discountPercentage,
          description: `${discountPercentage}% discount`,
          pointsCost,
          status: 'active',
          maxUses: 1,
          usedCount: 0,
          usageCount: 0,
          usageLimit: 1,
          isActive: true,
          isUsed: false,
          validFrom: Timestamp.now(),
          validUntil: Timestamp.fromDate(validUntil),
          applicableCategories: [],
          minimumOrderAmount: 0,
          generatedFrom: 'points_redemption',
          createdAt: Timestamp.now()
        };

        const discountRef = doc(collection(db, this.DISCOUNTS_COLLECTION));
        transaction.set(discountRef, discount);

        // Deduct points - this will be handled by the deductPoints method
        // but we need to update the rewards here in the same transaction
        const pointTransaction: Omit<PointTransaction, 'id'> = {
          userId,
          points: -pointsCost,
          type: 'used',
          reason: 'discount_redemption',
          description: 'Points used for discount',
          status: 'confirmed',
          balanceBefore: userRewards.availablePoints,
          balanceAfter: userRewards.availablePoints - pointsCost,
          metadata: { discountCode, discountId: discountRef.id },
          createdAt: Timestamp.now()
        };

        const transactionRef = doc(collection(db, this.TRANSACTIONS_COLLECTION));
        transaction.set(transactionRef, pointTransaction);

        const updatedRewards: any = {
          availablePoints: userRewards.availablePoints - pointsCost,
          usedPoints: (userRewards.usedPoints || 0) + pointsCost,
          discountsEarned: (userRewards.discountsEarned || 0) + 1,
          lastActivityDate: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        transaction.update(rewardsRef, updatedRewards);

        return {
          id: discountRef.id,
          ...discount
        } as Discount;
      });
    } catch (error) {
      console.error('Error creating discount:', error);
      throw error;
    }
  }

  static async getUserDiscounts(userId: string, includeUsed = false): Promise<Discount[]> {
    try {
      const q = query(
        collection(db, this.DISCOUNTS_COLLECTION),
        where('userId', '==', userId),
        ...(includeUsed ? [] : [where('isUsed', '==', false)]),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Discount[];
    } catch (error) {
      console.error('Error getting user discounts:', error);
      throw error;
    }
  }

  static async validateDiscount(code: string, orderAmount: number): Promise<Discount | null> {
    try {
      const q = query(
        collection(db, this.DISCOUNTS_COLLECTION),
        where('code', '==', code),
        where('isActive', '==', true),
        where('isUsed', '==', false)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const discount = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Discount;
      
      // Check validity
      const now = new Date();
      if (discount.validUntil.toDate() < now) return null;
      if (discount.validFrom.toDate() > now) return null;
      if (discount.minimumOrderAmount && discount.minimumOrderAmount > orderAmount) {
        return null;
      }
      if (discount.usageCount >= discount.usageLimit) return null;
      
      return discount;
    } catch (error) {
      console.error('Error validating discount:', error);
      throw error;
    }
  }

  static async useDiscount(discountId: string, orderAmount: number, orderId: string): Promise<number> {
    try {
      return await runTransaction(db, async (transaction) => {
        const discountRef = doc(db, this.DISCOUNTS_COLLECTION, discountId);
        const discountDoc = await transaction.get(discountRef);
        
        if (!discountDoc.exists()) {
          throw new Error('Discount not found');
        }
        
        const discount = { id: discountDoc.id, ...discountDoc.data() } as Discount;
        
        if (discount.isUsed || !discount.isActive) {
          throw new Error('Discount is not valid');
        }
        
        const discountAmount = calculateDiscountAmount(discount, orderAmount);
        
        // Mark discount as used
        transaction.update(discountRef, {
          isUsed: true,
          usageCount: discount.usageCount + 1,
          usedAt: Timestamp.now(),
          usedForOrder: orderId
        });

        // Update user rewards with savings
        const rewardsRef = doc(db, this.REWARDS_COLLECTION, discount.userId);
        const rewardsDoc = await transaction.get(rewardsRef);
        
        if (rewardsDoc.exists()) {
          const userRewards = { userId: discount.userId, ...rewardsDoc.data() } as UserRewards;
          transaction.update(rewardsRef, {
            discountsUsed: (userRewards.discountsUsed || 0) + 1,
            totalSavings: (userRewards.totalSavings || 0) + discountAmount,
            lastActivityDate: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        }

        return discountAmount;
      });
    } catch (error) {
      console.error('Error using discount:', error);
      throw error;
    }
  }

  // Helper Methods
  private static calculateTier(totalPoints: number): UserRewards['tier'] {
    if (totalPoints >= 500) return 'Platinum';
    if (totalPoints >= 200) return 'Gold';
    if (totalPoints >= 50) return 'Silver';
    return 'Bronze';
  }

  private static calculateReliabilityScore(onTimeReturns: number, lateReturns: number): number {
    const totalReturns = onTimeReturns + lateReturns;
    if (totalReturns === 0) return 100;
    
    const onTimePercentage = (onTimeReturns / totalReturns) * 100;
    return Math.round(onTimePercentage);
  }

  private static calculateLatePenalty(tier: UserRewards['tier']): number {
    const penalties = {
      Bronze: 5,
      Silver: 10,
      Gold: 15,
      Platinum: 20
    };
    return penalties[tier] || 5;
  }

  private static generateDiscountCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BOLEKA';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Analytics and Reporting
  static async getPointsHistory(userId: string, limitCount = 50): Promise<PointTransaction[]> {
    try {
      const q = query(
        collection(db, this.TRANSACTIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PointTransaction[];
    } catch (error) {
      console.error('Error getting points history:', error);
      throw error;
    }
  }

  static async getLeaderboard(limitCount = 10): Promise<UserRewards[]> {
    try {
      const q = query(
        collection(db, this.REWARDS_COLLECTION),
        orderBy('totalPoints', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        userId: doc.id,
        ...doc.data()
      })) as UserRewards[];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }
}