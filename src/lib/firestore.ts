"use client";

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

// Generic Firestore service
export class FirestoreService {
  // Add document to collection
  static async addDocument(collectionName: string, data: any) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding document:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get all documents from collection
  static async getDocuments(collectionName: string, conditions?: any) {
    try {
      let q: any = collection(db, collectionName);
      
      if (conditions?.where) {
        q = query(q, where(conditions.where.field, conditions.where.operator, conditions.where.value));
      }
      
      if (conditions?.orderBy) {
        q = query(q, orderBy(conditions.orderBy.field, conditions.orderBy.direction || 'asc'));
      }
      
      if (conditions?.limit) {
        q = query(q, limit(conditions.limit));
      }

      const querySnapshot = await getDocs(q);
      const documents: any[] = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...(doc.data() as any) });
      });
      
      return { success: true, data: documents };
    } catch (error) {
      console.error("Error getting documents:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get single document
  static async getDocument(collectionName: string, documentId: string) {
    try {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: "Document not found" };
      }
    } catch (error) {
      console.error("Error getting document:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Update document
  static async updateDocument(collectionName: string, documentId: string, data: any) {
    try {
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error) {
      console.error("Error updating document:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Delete document
  static async deleteDocument(collectionName: string, documentId: string) {
    try {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error("Error deleting document:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Specific collections services
export class UserFirestoreService {
  static async addUser(userData: any) {
    return FirestoreService.addDocument("users", userData);
  }

  static async getUsers() {
    return FirestoreService.getDocuments("users");
  }

  static async getUserById(userId: string) {
    return FirestoreService.getDocument("users", userId);
  }

  static async updateUser(userId: string, userData: any) {
    return FirestoreService.updateDocument("users", userId, userData);
  }
}

export class ItemFirestoreService {
  static async addItem(itemData: any) {
    return FirestoreService.addDocument("items", itemData);
  }

  static async getItems(conditions?: any) {
    return FirestoreService.getDocuments("items", conditions);
  }

  static async getItemById(itemId: string) {
    return FirestoreService.getDocument("items", itemId);
  }

  static async updateItem(itemId: string, itemData: any) {
    return FirestoreService.updateDocument("items", itemId, itemData);
  }

  static async deleteItem(itemId: string) {
    return FirestoreService.deleteDocument("items", itemId);
  }
}
