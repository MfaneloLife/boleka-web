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

  static async getItems(filters?: { category?: string; ownerId?: string; isAvailable?: boolean }): Promise<{ success: boolean; items?: Item[]; error?: string }> {
    try {
      let query = adminDb.collection('items');
      
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
      const items: Item[] = [];
      
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Item);
      });
      
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
