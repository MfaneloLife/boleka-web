import { adminDb } from './firebase-admin';
import { Timestamp } from "firebase-admin/firestore";

// Types matching your Prisma schema
export interface User {
  id: string;
  name?: string;
  email: string;
  password?: string;
  firebaseUid?: string;
  image?: string;
  hasBusinessProfile: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  category: string;
  province: string;
  city: string;
  suburb: string;
  phone: string;
  access: string; // Delivery, Collection only, Both
  website?: string;
  isVerified: boolean;
  // Banking details
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  branchCode?: string;
  accountHolderName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  province: string;
  city: string;
  suburb?: string;
  phone?: string;
  preferences: string; // Everything, Tools, Equipment
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  condition: string;
  dailyPrice: number;
  isAvailable: boolean;
  images: string[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  requestId: string;
  amount: number;
  commissionAmount: number;
  merchantAmount: number;
  merchantPaid: boolean;
  merchantPayoutDate?: Date;
  status: string; // PENDING, COMPLETED, FAILED, CANCELLED
  transactionId?: string;
  paymentMethod?: string; // PAYFAST, CASH, etc.
  paymentDetails?: string; // JSON string with payment details
  payerId: string;
  merchantId: string; // The business owner receiving the payment
  createdAt: Date;
  updatedAt: Date;
  // Related data for display purposes
  request?: {
    id: string;
    item: {
      id: string;
      name: string;
      title: string;
    };
  };
  payer?: {
    id: string;
    name: string;
    email: string;
  };
}

// Database service class
export class FirebaseDbService {
  // User operations
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const docRef = await adminDb.collection('users').add({
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error("Error creating user:", error);
      return { success: false, error: error.message };
    }
  }

  static async getUserByEmail(email: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const querySnapshot = await adminDb.collection('users').where('email', '==', email).get();
      
      if (querySnapshot.empty) {
        return { success: false, error: 'User not found' };
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = { id: userDoc.id, ...userDoc.data() } as User;
      return { success: true, user: userData };
    } catch (error: any) {
      console.error("Error getting user by email:", error);
      return { success: false, error: error.message };
    }
  }

  static async getUserById(userId: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return { success: false, error: 'User not found' };
      }
      
      const userData = { id: userDoc.id, ...userDoc.data() } as User;
      return { success: true, user: userData };
    } catch (error: any) {
      console.error("Error getting user by ID:", error);
      return { success: false, error: error.message };
    }
  }

  static async updateUser(userId: string, userData: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      await adminDb.collection('users').doc(userId).update({
        ...userData,
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating user:", error);
      return { success: false, error: error.message };
    }
  }

  // Business Profile operations
  static async createBusinessProfile(profileData: Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const docRef = await adminDb.collection('businessProfiles').add({
        ...profileData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error("Error creating business profile:", error);
      return { success: false, error: error.message };
    }
  }

  static async getBusinessProfileByUserId(userId: string): Promise<{ success: boolean; profile?: BusinessProfile; error?: string }> {
    try {
      const querySnapshot = await adminDb.collection('businessProfiles').where('userId', '==', userId).get();
      
      if (querySnapshot.empty) {
        return { success: false, error: 'Business profile not found' };
      }
      
      const profileDoc = querySnapshot.docs[0];
      const profileData = { id: profileDoc.id, ...profileDoc.data() } as BusinessProfile;
      return { success: true, profile: profileData };
    } catch (error: any) {
      console.error("Error getting business profile:", error);
      return { success: false, error: error.message };
    }
  }

  static async updateBusinessProfile(userId: string, profileData: Partial<BusinessProfile>): Promise<{ success: boolean; profile?: BusinessProfile; error?: string }> {
    try {
      const querySnapshot = await adminDb.collection('businessProfiles').where('userId', '==', userId).get();
      
      if (querySnapshot.empty) {
        return { success: false, error: 'Business profile not found' };
      }
      
      const profileDoc = querySnapshot.docs[0];
      await profileDoc.ref.update({
        ...profileData,
        updatedAt: Timestamp.now()
      });
      
      const updatedDoc = await profileDoc.ref.get();
      const updatedProfile = { id: updatedDoc.id, ...updatedDoc.data() } as BusinessProfile;
      return { success: true, profile: updatedProfile };
    } catch (error: any) {
      console.error("Error updating business profile:", error);
      return { success: false, error: error.message };
    }
  }

  static async getAllBusinessProfiles(): Promise<{ success: boolean; profiles?: BusinessProfile[]; error?: string }> {
    try {
      const querySnapshot = await adminDb.collection('businessProfiles').get();
      
      const profiles: BusinessProfile[] = [];
      querySnapshot.forEach(doc => {
        profiles.push({ id: doc.id, ...doc.data() } as BusinessProfile);
      });
      
      return { success: true, profiles };
    } catch (error: any) {
      console.error("Error getting all business profiles:", error);
      return { success: false, error: error.message };
    }
  }

  // Client Profile operations
  static async createClientProfile(profileData: Omit<ClientProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const docRef = await adminDb.collection('clientProfiles').add({
        ...profileData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error("Error creating client profile:", error);
      return { success: false, error: error.message };
    }
  }

  static async getClientProfileByUserId(userId: string): Promise<{ success: boolean; profile?: ClientProfile; error?: string }> {
    try {
      const querySnapshot = await adminDb.collection('clientProfiles').where('userId', '==', userId).get();
      
      if (querySnapshot.empty) {
        return { success: false, error: 'Client profile not found' };
      }
      
      const profileDoc = querySnapshot.docs[0];
      const profileData = { id: profileDoc.id, ...profileDoc.data() } as ClientProfile;
      return { success: true, profile: profileData };
    } catch (error: any) {
      console.error("Error getting client profile:", error);
      return { success: false, error: error.message };
    }
  }

  static async updateClientProfile(userId: string, profileData: Partial<ClientProfile>): Promise<{ success: boolean; profile?: ClientProfile; error?: string }> {
    try {
      const querySnapshot = await adminDb.collection('clientProfiles').where('userId', '==', userId).get();
      
      if (querySnapshot.empty) {
        return { success: false, error: 'Client profile not found' };
      }
      
      const profileDoc = querySnapshot.docs[0];
      await profileDoc.ref.update({
        ...profileData,
        updatedAt: Timestamp.now()
      });
      
      const updatedDoc = await profileDoc.ref.get();
      const updatedProfile = { id: updatedDoc.id, ...updatedDoc.data() } as ClientProfile;
      return { success: true, profile: updatedProfile };
    } catch (error: any) {
      console.error("Error updating client profile:", error);
      return { success: false, error: error.message };
    }
  }

  // Item operations
  static async createItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const docRef = await adminDb.collection('items').add({
        ...itemData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error("Error creating item:", error);
      return { success: false, error: error.message };
    }
  }

  static async getItems(filters?: { category?: string; ownerId?: string; isAvailable?: boolean; location?: string }): Promise<{ success: boolean; items?: any[]; error?: string }> {
    try {
      let query: any = adminDb.collection('items');
      
      if (filters?.category) {
        query = query.where('category', '==', filters.category);
      }
      if (filters?.ownerId) {
        query = query.where('ownerId', '==', filters.ownerId);
      }
      if (filters?.isAvailable !== undefined) {
        query = query.where('isAvailable', '==', filters.isAvailable);
      }
      
      const querySnapshot = await query.orderBy('createdAt', 'desc').get();
      const items: any[] = [];
      
      // Get all items first
      const itemsData: Item[] = [];
      querySnapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() } as Item);
      });

      // Enhance items with owner location information
      for (const item of itemsData) {
        const businessProfileResult = await this.getBusinessProfileByUserId(item.ownerId);
        
        const enhancedItem = {
          ...item,
          ownerLocation: businessProfileResult.success && businessProfileResult.profile ? {
            province: businessProfileResult.profile.province,
            city: businessProfileResult.profile.city,
            suburb: businessProfileResult.profile.suburb
          } : null
        };

        // Apply location filter if specified
        if (filters?.location) {
          const location = filters.location.toLowerCase();
          if (enhancedItem.ownerLocation) {
            const matchesProvince = enhancedItem.ownerLocation.province?.toLowerCase().replace(/\s+/g, '-') === location;
            const matchesCity = enhancedItem.ownerLocation.city?.toLowerCase().replace(/\s+/g, '-') === location;
            
            if (matchesProvince || matchesCity) {
              items.push(enhancedItem);
            }
          }
        } else {
          items.push(enhancedItem);
        }
      }
      
      return { success: true, items };
    } catch (error: any) {
      console.error("Error getting items:", error);
      return { success: false, error: error.message };
    }
  }

  static async getItemById(itemId: string): Promise<{ success: boolean; item?: Item; error?: string }> {
    try {
      const itemDoc = await adminDb.collection('items').doc(itemId).get();
      
      if (!itemDoc.exists) {
        return { success: false, error: 'Item not found' };
      }
      
      const itemData = { id: itemDoc.id, ...itemDoc.data() } as Item;
      return { success: true, item: itemData };
    } catch (error: any) {
      console.error("Error getting item:", error);
      return { success: false, error: error.message };
    }
  }

  static async updateItem(itemId: string, itemData: Partial<Item>): Promise<{ success: boolean; error?: string }> {
    try {
      await adminDb.collection('items').doc(itemId).update({
        ...itemData,
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating item:", error);
      return { success: false, error: error.message };
    }
  }

  static async deleteItem(itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await adminDb.collection('items').doc(itemId).delete();
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting item:", error);
      return { success: false, error: error.message };
    }
  }

  // Payment operations
  static async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const docRef = await adminDb.collection('payments').add({
        ...paymentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error("Error creating payment:", error);
      return { success: false, error: error.message };
    }
  }

  static async getPaymentsByMerchant(merchantId: string): Promise<{ success: boolean; payments?: Payment[]; error?: string }> {
    try {
      // Get all completed/successful payments for this merchant
      const querySnapshot = await adminDb.collection('payments')
        .where('merchantId', '==', merchantId)
        .where('status', 'in', ['COMPLETED', 'PAID'])
        .orderBy('createdAt', 'desc')
        .get();
      
      const payments: Payment[] = [];
      
      for (const doc of querySnapshot.docs) {
        const paymentData = { id: doc.id, ...doc.data() } as Payment;
        
        // Get related request and item data for display
        try {
          const requestDoc = await adminDb.collection('requests').doc(paymentData.requestId).get();
          if (requestDoc.exists) {
            const requestData = requestDoc.data();
            
            // Get item data
            const itemDoc = await adminDb.collection('items').doc(requestData?.itemId).get();
            if (itemDoc.exists) {
              const itemData = itemDoc.data();
              paymentData.request = {
                id: requestDoc.id,
                item: {
                  id: itemDoc.id,
                  name: itemData?.name || 'Unknown Item',
                  title: itemData?.name || 'Unknown Item'
                }
              };
            }
            
            // Get payer data
            const payerDoc = await adminDb.collection('users').doc(paymentData.payerId).get();
            if (payerDoc.exists) {
              const payerData = payerDoc.data();
              paymentData.payer = {
                id: payerDoc.id,
                name: payerData?.name || 'Unknown User',
                email: payerData?.email || 'Unknown Email'
              };
            }
          }
        } catch (relatedDataError) {
          console.error('Error fetching related payment data:', relatedDataError);
          // Continue without related data
        }
        
        payments.push(paymentData);
      }
      
      return { success: true, payments };
    } catch (error: any) {
      console.error("Error getting payments by merchant:", error);
      return { success: false, error: error.message };
    }
  }

  static async updatePayment(paymentId: string, paymentData: Partial<Payment>): Promise<{ success: boolean; error?: string }> {
    try {
      await adminDb.collection('payments').doc(paymentId).update({
        ...paymentData,
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating payment:", error);
      return { success: false, error: error.message };
    }
  }

  // Request operations
  static async getRequestById(requestId: string): Promise<{ success: boolean; request?: any; error?: string }> {
    try {
      const requestDoc = await adminDb.collection('requests').doc(requestId).get();
      
      if (!requestDoc.exists) {
        return { success: false, error: 'Request not found' };
      }
      
      const requestData = { id: requestDoc.id, ...requestDoc.data() };
      return { success: true, request: requestData };
    } catch (error: any) {
      console.error("Error getting request by ID:", error);
      return { success: false, error: error.message };
    }
  }

  static async updateRequest(requestId: string, requestData: any): Promise<{ success: boolean; error?: string }> {
    try {
      await adminDb.collection('requests').doc(requestId).update({
        ...requestData,
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating request:", error);
      return { success: false, error: error.message };
    }
  }
}

// Service exports for easy access
export const userService = {
  createUser: FirebaseDbService.createUser,
  getUserByEmail: FirebaseDbService.getUserByEmail,
  getUserById: FirebaseDbService.getUserById,
  updateUser: FirebaseDbService.updateUser,
};

export const businessProfileService = {
  createBusinessProfile: FirebaseDbService.createBusinessProfile,
  getBusinessProfileByUserId: FirebaseDbService.getBusinessProfileByUserId,
  updateBusinessProfile: FirebaseDbService.updateBusinessProfile,
};

export const clientProfileService = {
  createClientProfile: FirebaseDbService.createClientProfile,
  getClientProfileByUserId: FirebaseDbService.getClientProfileByUserId,
  updateClientProfile: FirebaseDbService.updateClientProfile,
};

export const itemService = {
  createItem: FirebaseDbService.createItem,
  getItems: FirebaseDbService.getItems,
  getItemById: FirebaseDbService.getItemById,
  updateItem: FirebaseDbService.updateItem,
  deleteItem: FirebaseDbService.deleteItem,
};
