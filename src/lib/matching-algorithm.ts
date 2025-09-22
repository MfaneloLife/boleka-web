import { db } from './firebase';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';

export interface ClientProfile {
  id: string;
  userId: string;
  province: string;
  city: string;
  suburb?: string;
  preferences: string[];
  quantity?: number; // Quantity of items client wants
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  province: string;
  city: string;
  suburb?: string;
  access: string;
  quantity?: number; // Quantity of items business has
}

export interface MatchResult {
  businessId: string;
  clientId: string;
  score: number;
  matchingFactors: {
    locationMatch: boolean;
    preferenceMatch: boolean;
    quantityCompatible: boolean;
  };
}

export class MatchingAlgorithm {
  
  /**
   * Find business matches for a client based on location, preferences, and quantity
   */
  async findBusinessMatches(clientId: string): Promise<MatchResult[]> {
    try {
      // Get client profile
      const clientProfile = await this.getClientProfile(clientId);
      if (!clientProfile) {
        throw new Error('Client profile not found');
      }

      // Get all business profiles in the same province
      const businessProfiles = await this.getBusinessProfilesByLocation(
        clientProfile.province,
        clientProfile.city
      );

      // Calculate matches
      const matches: MatchResult[] = [];

      for (const business of businessProfiles) {
        const matchResult = this.calculateMatch(clientProfile, business);
        if (matchResult.score > 0) {
          matches.push(matchResult);
        }
      }

      // Sort by score (highest first)
      return matches.sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('Error finding business matches:', error);
      throw error;
    }
  }

  /**
   * Find client matches for a business based on location, preferences, and quantity
   */
  async findClientMatches(businessId: string): Promise<MatchResult[]> {
    try {
      // Get business profile
      const businessProfile = await this.getBusinessProfile(businessId);
      if (!businessProfile) {
        throw new Error('Business profile not found');
      }

      // Get all client profiles in the same province
      const clientProfiles = await this.getClientProfilesByLocation(
        businessProfile.province,
        businessProfile.city
      );

      // Calculate matches
      const matches: MatchResult[] = [];

      for (const client of clientProfiles) {
        const matchResult = this.calculateMatch(client, businessProfile);
        if (matchResult.score > 0) {
          matches.push(matchResult);
        }
      }

      // Sort by score (highest first)
      return matches.sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('Error finding client matches:', error);
      throw error;
    }
  }

  /**
   * Calculate match score between client and business
   */
  private calculateMatch(client: ClientProfile, business: BusinessProfile): MatchResult {
    let score = 0;
    const matchingFactors = {
      locationMatch: false,
      preferenceMatch: false,
      quantityCompatible: false
    };

    // Location matching (60% weight)
    const locationScore = this.calculateLocationScore(client, business);
    if (locationScore > 0) {
      matchingFactors.locationMatch = true;
      score += locationScore * 0.6;
    }

    // Preference matching (30% weight)
    const preferenceScore = this.calculatePreferenceScore(client);
    if (preferenceScore > 0) {
      matchingFactors.preferenceMatch = true;
      score += preferenceScore * 0.3;
    }

    // Quantity compatibility (10% weight)
    const quantityScore = this.calculateQuantityScore(client, business);
    if (quantityScore > 0) {
      matchingFactors.quantityCompatible = true;
      score += quantityScore * 0.1;
    }

    return {
      businessId: business.id,
      clientId: client.id,
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      matchingFactors
    };
  }

  /**
   * Calculate location-based matching score
   */
  private calculateLocationScore(client: ClientProfile, business: BusinessProfile): number {
    // Same province is required
    if (client.province !== business.province) {
      return 0;
    }

    // Same city gets full points
    if (client.city === business.city) {
      // Same suburb gets bonus
      if (client.suburb && business.suburb && client.suburb === business.suburb) {
        return 1.0; // Perfect location match
      }
      return 0.8; // Same city, different suburb
    }

    // Different city but same province
    return 0.3;
  }

  /**
   * Calculate preference-based matching score
   */
  private calculatePreferenceScore(client: ClientProfile): number {
    // If client wants 'Everything', they match with all businesses
    if (client.preferences.includes('Everything')) {
      return 1.0;
    }

    // For now, give score based on preference specificity
    // More specific preferences get higher scores
    const preferenceCount = client.preferences.length;
    if (preferenceCount === 1) {
      return 0.9; // Very specific
    } else if (preferenceCount <= 3) {
      return 0.7; // Moderately specific
    } else {
      return 0.5; // Less specific
    }
  }

  /**
   * Calculate quantity compatibility score
   */
  private calculateQuantityScore(client: ClientProfile, business: BusinessProfile): number {
    // If neither has quantity specified, assume compatible
    if (!client.quantity && !business.quantity) {
      return 1.0;
    }

    // If business has more or equal quantity than client needs
    if (business.quantity && client.quantity && business.quantity >= client.quantity) {
      return 1.0;
    }

    // If only one has quantity, assume compatible
    if (!client.quantity || !business.quantity) {
      return 0.8;
    }

    // Business has less than client needs
    return 0.3;
  }

  /**
   * Get client profile by ID
   */
  private async getClientProfile(clientId: string): Promise<ClientProfile | null> {
    try {
      const clientDoc = await getDocs(query(
        collection(db, 'clientProfiles'),
        where('userId', '==', clientId)
      ));

      if (clientDoc.empty) {
        return null;
      }

      const doc = clientDoc.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        userId: data.userId,
        province: data.province,
        city: data.city,
        suburb: data.suburb,
        preferences: Array.isArray(data.preferences) ? data.preferences : [data.preferences],
        quantity: data.quantity
      };
    } catch (error) {
      console.error('Error getting client profile:', error);
      return null;
    }
  }

  /**
   * Get business profile by ID
   */
  private async getBusinessProfile(businessId: string): Promise<BusinessProfile | null> {
    try {
      const businessDoc = await getDocs(query(
        collection(db, 'businessProfiles'),
        where('userId', '==', businessId)
      ));

      if (businessDoc.empty) {
        return null;
      }

      const doc = businessDoc.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        userId: data.userId,
        businessName: data.businessName,
        province: data.province,
        city: data.city,
        suburb: data.suburb,
        access: data.access,
        quantity: data.quantity
      };
    } catch (error) {
      console.error('Error getting business profile:', error);
      return null;
    }
  }

  /**
   * Get business profiles by location
   */
  private async getBusinessProfilesByLocation(province: string, city?: string): Promise<BusinessProfile[]> {
    try {
      const businessQuery = query(
        collection(db, 'businessProfiles'),
        where('province', '==', province)
      );

      const businessDocs = await getDocs(businessQuery);
      const businesses: BusinessProfile[] = [];

      businessDocs.forEach(doc => {
        const data = doc.data();
        businesses.push({
          id: doc.id,
          userId: data.userId,
          businessName: data.businessName,
          province: data.province,
          city: data.city,
          suburb: data.suburb,
          access: data.access,
          quantity: data.quantity
        });
      });

      return businesses;
    } catch (error) {
      console.error('Error getting business profiles by location:', error);
      return [];
    }
  }

  /**
   * Get client profiles by location
   */
  private async getClientProfilesByLocation(province: string, city?: string): Promise<ClientProfile[]> {
    try {
      const clientQuery = query(
        collection(db, 'clientProfiles'),
        where('province', '==', province)
      );

      const clientDocs = await getDocs(clientQuery);
      const clients: ClientProfile[] = [];

      clientDocs.forEach(doc => {
        const data = doc.data();
        clients.push({
          id: doc.id,
          userId: data.userId,
          province: data.province,
          city: data.city,
          suburb: data.suburb,
          preferences: Array.isArray(data.preferences) ? data.preferences : [data.preferences],
          quantity: data.quantity
        });
      });

      return clients;
    } catch (error) {
      console.error('Error getting client profiles by location:', error);
      return [];
    }
  }
}

// Export singleton instance
export const matchingAlgorithm = new MatchingAlgorithm();