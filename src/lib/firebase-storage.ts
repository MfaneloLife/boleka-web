import { adminDb, adminStorage } from '@/src/lib/firebase-admin';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/src/lib/firebase';

// Types for item data
export interface ItemData {
  id?: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  location: string;
  condition: 'new' | 'used' | 'refurbished';
  images: string[]; // URLs of uploaded images
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  status: 'available' | 'rented' | 'maintenance';
  tags?: string[];
  specifications?: Record<string, any>;
  availability?: {
    startDate: Date;
    endDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Upload multiple images for an item
export async function uploadItemImages(
  images: File[],
  itemId: string,
  userId: string
): Promise<string[]> {
  const uploadPromises = images.map(async (image, index) => {
    const imagePath = `items/${userId}/${itemId}/image_${index}_${Date.now()}.${image.name.split('.').pop()}`;
    const imageRef = ref(storage, imagePath);
    
    await uploadBytes(imageRef, image);
    return await getDownloadURL(imageRef);
  });

  return Promise.all(uploadPromises);
}

// Create a new item with images
export async function createItem(itemData: Omit<ItemData, 'id' | 'createdAt' | 'updatedAt'>, images?: File[]): Promise<string> {
  try {
    // Create item document first to get ID
    const itemRef = await adminDb.collection('items').add({
      ...itemData,
      images: [], // Will be updated after image upload
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Upload images if provided
    if (images && images.length > 0) {
      const imageUrls = await uploadItemImages(images, itemRef.id, itemData.ownerId);
      
      // Update item with image URLs
      await itemRef.update({
        images: imageUrls,
        updatedAt: new Date(),
      });
    }

    return itemRef.id;
  } catch (error) {
    console.error('Error creating item:', error);
    throw new Error('Failed to create item');
  }
}

// Update an existing item
export async function updateItem(itemId: string, updates: Partial<ItemData>, newImages?: File[]): Promise<void> {
  try {
    const itemRef = adminDb.collection('items').doc(itemId);
    const itemDoc = await itemRef.get();
    
    if (!itemDoc.exists) {
      throw new Error('Item not found');
    }

    const currentData = itemDoc.data() as ItemData;
    
    // Upload new images if provided
    let imageUrls = currentData.images || [];
    if (newImages && newImages.length > 0) {
      const newImageUrls = await uploadItemImages(newImages, itemId, currentData.ownerId);
      imageUrls = [...imageUrls, ...newImageUrls];
    }

    // Update item data
    await itemRef.update({
      ...updates,
      images: imageUrls,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating item:', error);
    throw new Error('Failed to update item');
  }
}

// Delete an item and its images
export async function deleteItem(itemId: string): Promise<void> {
  try {
    const itemRef = adminDb.collection('items').doc(itemId);
    const itemDoc = await itemRef.get();
    
    if (!itemDoc.exists) {
      throw new Error('Item not found');
    }

    const itemData = itemDoc.data() as ItemData;
    
    // Delete all images from storage
    if (itemData.images && itemData.images.length > 0) {
      const deletePromises = itemData.images.map(async (imageUrl) => {
        try {
          // Extract path from URL and delete
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      });
      
      await Promise.all(deletePromises);
    }

    // Delete item document
    await itemRef.delete();
  } catch (error) {
    console.error('Error deleting item:', error);
    throw new Error('Failed to delete item');
  }
}

// Get items by category
export async function getItemsByCategory(category: string, limit: number = 20): Promise<ItemData[]> {
  try {
    const itemsSnapshot = await adminDb
      .collection('items')
      .where('category', '==', category)
      .where('status', '==', 'available')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ItemData[];
  } catch (error) {
    console.error('Error getting items by category:', error);
    throw new Error('Failed to get items');
  }
}

// Search items
export async function searchItems(query: string, filters?: {
  category?: string;
  location?: string;
  priceRange?: { min: number; max: number };
}): Promise<ItemData[]> {
  try {
    let itemsQuery = adminDb.collection('items').where('status', '==', 'available');

    // Apply filters
    if (filters?.category) {
      itemsQuery = itemsQuery.where('category', '==', filters.category);
    }
    
    if (filters?.location) {
      itemsQuery = itemsQuery.where('location', '==', filters.location);
    }

    const itemsSnapshot = await itemsQuery
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    let items = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ItemData[];

    // Filter by text search (client-side for now)
    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      items = items.filter(item => {
        const searchText = `${item.title} ${item.description} ${item.tags?.join(' ')}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });
    }

    // Filter by price range
    if (filters?.priceRange) {
      items = items.filter(item => 
        item.price >= filters.priceRange!.min && 
        item.price <= filters.priceRange!.max
      );
    }

    return items;
  } catch (error) {
    console.error('Error searching items:', error);
    throw new Error('Failed to search items');
  }
}

// Get user's items
export async function getUserItems(userId: string): Promise<ItemData[]> {
  try {
    const itemsSnapshot = await adminDb
      .collection('items')
      .where('ownerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ItemData[];
  } catch (error) {
    console.error('Error getting user items:', error);
    throw new Error('Failed to get user items');
  }
}

// Get single item by ID
export async function getItemById(itemId: string): Promise<ItemData | null> {
  try {
    const itemDoc = await adminDb.collection('items').doc(itemId).get();
    
    if (!itemDoc.exists) {
      return null;
    }

    return {
      id: itemDoc.id,
      ...itemDoc.data(),
      createdAt: itemDoc.data()?.createdAt?.toDate() || new Date(),
      updatedAt: itemDoc.data()?.updatedAt?.toDate() || new Date(),
    } as ItemData;
  } catch (error) {
    console.error('Error getting item by ID:', error);
    throw new Error('Failed to get item');
  }
}