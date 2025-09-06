import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  serverTimestamp,
  updateDoc,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import { getDownloadURL, ref, uploadBytes, uploadString } from 'firebase/storage';
import { storage } from './firebase';

// Define message interface
export interface FirebaseMessage {
  id?: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImage?: string | null;
  requestId: string;
  createdAt: Date | { toDate?: () => Date } | null;
  imageUrl?: string | null;
}

// Firebase collections
const MESSAGES_COLLECTION = 'messages';
const CONVERSATIONS_COLLECTION = 'conversations';

// Get messages for a specific request
export async function getMessagesForRequest(requestId: string) {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('requestId', '==', requestId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const messages: FirebaseMessage[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<FirebaseMessage, 'id'>;
      messages.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      });
    });

    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

// Send a new message
export async function sendMessage(
  message: Omit<FirebaseMessage, 'id' | 'createdAt'>, 
  imageBase64?: string,
  imageType?: string
) {
  try {
    let imageUrl = null;

    // If there's an image, upload it to storage
    if (imageBase64 && imageType) {
      const imageFormat = imageType.split('/')[1] || 'jpeg';
      const storageRef = ref(storage, `message-images/${Date.now()}.${imageFormat}`);
      
      // Upload base64 string to Firebase Storage
      await uploadString(storageRef, imageBase64, 'base64', {
        contentType: imageType
      });
      
      // Get the download URL
      imageUrl = await getDownloadURL(storageRef);
    }

    // Add the message to Firestore
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
      ...message,
      imageUrl,
      createdAt: serverTimestamp(),
    });

    // Update the conversation's last message
    await updateConversationLastMessage(message.requestId, {
      lastMessageContent: message.content || 'Sent an image',
      lastMessageSenderId: message.senderId,
      lastMessageSenderName: message.senderName,
      updatedAt: serverTimestamp(),
    });

    // Return the created message
    const messageSnapshot = await getDoc(docRef);
  const messageData = messageSnapshot.data() as Omit<FirebaseMessage, 'id'>;
    
    return {
      id: messageSnapshot.id,
      ...messageData,
      createdAt: messageData.createdAt?.toDate ? messageData.createdAt.toDate() : new Date(),
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Update conversation's last message
type ConversationLastMessageUpdate = {
  lastMessageContent: string;
  lastMessageSenderId: string;
  lastMessageSenderName: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
};

async function updateConversationLastMessage(requestId: string, update: ConversationLastMessageUpdate) {
  try {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, requestId);
    const conversationSnapshot = await getDoc(conversationRef);

    if (conversationSnapshot.exists()) {
      // Update existing conversation
      await updateDoc(conversationRef, update);
    } else {
      // Create new conversation document
      await addDoc(collection(db, CONVERSATIONS_COLLECTION), {
        requestId,
        ...update
      });
    }
  } catch (error) {
    console.error('Error updating conversation:', error);
  }
}

// Get all conversations for a user
export async function getUserConversations(userId: string) {
  try {
    const requestsQuery = query(
      collection(db, 'requests'),
      where('participantIds', 'array-contains', userId)
    );

    const requestsSnapshot = await getDocs(requestsQuery);
    const conversations = [];

    for (const requestDoc of requestsSnapshot.docs) {
      const requestData = requestDoc.data();
      
      // Get the last message for this request
      const messagesQuery = query(
        collection(db, MESSAGES_COLLECTION),
        where('requestId', '==', requestDoc.id),
        orderBy('createdAt', 'desc'),
        // Limit to 1 to get only the most recent message
        // Firestore has a "limit" method you can use
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      let lastMessage = null;
      
      if (!messagesSnapshot.empty) {
        const messageDoc = messagesSnapshot.docs[0];
        const messageData = messageDoc.data();
        
        lastMessage = {
          id: messageDoc.id,
          ...messageData,
          createdAt: messageData.createdAt?.toDate ? messageData.createdAt.toDate() : new Date()
        };
      }

      conversations.push({
        id: requestDoc.id,
        ...requestData,
        lastMessage
      });
    }

    return conversations;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
}

// Upload an image to Firebase Storage
export async function uploadImage(file: File, path = 'images') {
  try {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
