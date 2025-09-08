import { adminDb } from './firebase-admin';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

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
  description?: string;
  category: string;
  address?: string;
  phone?: string;
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
  phone?: string;
  address?: string;
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
      const docRef = await addDoc(collection(db, 'users'), {
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
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
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
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
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
      await updateDoc(doc(db, 'users', userId), {
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
      const docRef = await addDoc(collection(db, 'businessProfiles'), {
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
      const q = query(collection(db, 'businessProfiles'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
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

  // Client Profile operations
  static async createClientProfile(profileData: Omit<ClientProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const docRef = await addDoc(collection(db, 'clientProfiles'), {
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
      const q = query(collection(db, 'clientProfiles'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
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

  // Item operations
  static async createItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const docRef = await addDoc(collection(db, 'items'), {
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

  static async getItems(conditions?: any): Promise<{ success: boolean; items?: Item[]; error?: string }> {
    try {
      let q = collection(db, 'items');
      
      if (conditions?.where) {
        q = query(q, where(conditions.where.field, conditions.where.operator, conditions.where.value));
      }
      
      if (conditions?.orderBy) {
        q = query(q, orderBy(conditions.orderBy.field, conditions.orderBy.direction || 'desc'));
      }
      
      if (conditions?.limit) {
        q = query(q, limit(conditions.limit));
      }

      const querySnapshot = await getDocs(q);
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
      const itemDoc = await getDoc(doc(db, 'items', itemId));
      
      if (!itemDoc.exists()) {
        return { success: false, error: 'Item not found' };
      }
      
      const itemData = { id: itemDoc.id, ...itemDoc.data() } as Item;
      return { success: true, item: itemData };
    } catch (error: any) {
      console.error("Error getting item by ID:", error);
      return { success: false, error: error.message };
    }
  }

  static async updateItem(itemId: string, itemData: Partial<Item>): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'items', itemId), {
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
      await deleteDoc(doc(db, 'items', itemId));
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting item:", error);
      return { success: false, error: error.message };
    }
  }

  static async getItemsByOwnerId(ownerId: string): Promise<{ success: boolean; items?: Item[]; error?: string }> {
    return this.getItems({
      where: { field: 'ownerId', operator: '==', value: ownerId },
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }
}

// Export service instances for easy use
export const userService = {
  getUserByEmail: FirebaseDbService.getUserByEmail.bind(FirebaseDbService),
  getUserById: FirebaseDbService.getUserById.bind(FirebaseDbService),
  createUser: FirebaseDbService.createUser.bind(FirebaseDbService),
  updateUser: FirebaseDbService.updateUser.bind(FirebaseDbService),
  deleteUser: FirebaseDbService.deleteUser.bind(FirebaseDbService),
};

export const businessProfileService = {
  getBusinessProfileByUserId: FirebaseDbService.getBusinessProfileByUserId.bind(FirebaseDbService),
  createBusinessProfile: FirebaseDbService.createBusinessProfile.bind(FirebaseDbService),
  updateBusinessProfile: FirebaseDbService.updateBusinessProfile.bind(FirebaseDbService),
  deleteBusinessProfile: FirebaseDbService.deleteBusinessProfile.bind(FirebaseDbService),
};

export const clientProfileService = {
  getClientProfileByUserId: FirebaseDbService.getClientProfileByUserId.bind(FirebaseDbService),
  createClientProfile: FirebaseDbService.createClientProfile.bind(FirebaseDbService),
  updateClientProfile: FirebaseDbService.updateClientProfile.bind(FirebaseDbService),
  deleteClientProfile: FirebaseDbService.deleteClientProfile.bind(FirebaseDbService),
};

export const itemService = {
  getItemById: FirebaseDbService.getItemById.bind(FirebaseDbService),
  createItem: FirebaseDbService.createItem.bind(FirebaseDbService),
  getItems: FirebaseDbService.getItems.bind(FirebaseDbService),
  updateItem: FirebaseDbService.updateItem.bind(FirebaseDbService),
  deleteItem: FirebaseDbService.deleteItem.bind(FirebaseDbService),
  getItemsByOwnerId: FirebaseDbService.getItemsByOwnerId.bind(FirebaseDbService),
};
