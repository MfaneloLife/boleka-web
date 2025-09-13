import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

// Process new item images when uploaded
export const processItemImage = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const contentType = object.contentType;

  // Exit if this is triggered on a file that is not an image.
  if (!contentType || !contentType.startsWith("image/")) {
    console.log("This is not an image.");
    return null;
  }

  // Exit if the image is already processed
  if (filePath && filePath.includes("_processed")) {
    console.log("Already processed");
    return null;
  }

  // Get the file name and item info from path
  const pathParts = filePath?.split("/");
  
  if (!pathParts || pathParts.length < 3) {
    console.log("Invalid file path structure");
    return null;
  }

  const userId = pathParts[1];
  const itemId = pathParts[2];

  console.log(`Processing image for item ${itemId} by user ${userId}`);

  try {
    // Update item document to mark image as processed
    const itemRef = db.collection("items").doc(itemId);
    const itemDoc = await itemRef.get();
    
    if (itemDoc.exists) {
      await itemRef.update({
        lastProcessed: admin.firestore.FieldValue.serverTimestamp(),
        imageProcessingStatus: "completed"
      });
      
      console.log(`Image processing completed for item ${itemId}`);
    }
  } catch (error) {
    console.error("Error processing image:", error);
  }

  return null;
});

// Process payment notifications
export const processPayment = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const paymentData = req.body;
    console.log("Processing payment:", paymentData);

    // Verify payment with PayFast (implement your verification logic)
    const isValidPayment = await verifyPayFastPayment(paymentData);

    if (isValidPayment) {
      // Update payment status in Firestore
      const paymentId = paymentData.custom_str1; // This should be your payment document ID
      
      if (paymentId) {
        await db.collection("payments").doc(paymentId).update({
          status: "completed",
          paymentData: paymentData,
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update related request status
        const requestId = paymentData.custom_str2; // If you pass request ID
        if (requestId) {
          await db.collection("requests").doc(requestId).update({
            status: "paid",
            paidAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        console.log(`Payment ${paymentId} processed successfully`);
      }
    }

    res.status(200).send("Payment processed");
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).send("Payment processing failed");
  }
});

// Send notifications when new messages are created
export const sendMessageNotification = functions.firestore
  .document("messages/{messageId}")
  .onCreate(async (snap, context) => {
    const messageData = snap.data();
    const messageId = context.params.messageId;

    try {
      // Get request details
      const requestRef = db.collection("requests").doc(messageData.requestId);
      const requestDoc = await requestRef.get();
      
      if (!requestDoc.exists) {
        console.log("Request not found");
        return null;
      }

      const requestData = requestDoc.data();
      
      // Determine who to notify (the other party in the conversation)
      const recipientId = messageData.senderId === requestData?.requesterId 
        ? requestData?.ownerId 
        : requestData?.requesterId;

      if (recipientId) {
        // Create notification
        await db.collection("notifications").add({
          userId: recipientId,
          type: "new_message",
          title: "New Message",
          message: `You have a new message from ${messageData.senderName}`,
          data: {
            messageId: messageId,
            requestId: messageData.requestId,
            senderId: messageData.senderId,
            senderName: messageData.senderName
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Notification sent for message ${messageId}`);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }

    return null;
  });

// Clean up old data periodically
export const cleanupOldData = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  const cutoffDate = new admin.firestore.Timestamp(now.seconds - (30 * 24 * 60 * 60), 0); // 30 days ago

  try {
    // Clean up old notifications
    const oldNotifications = await db.collection("notifications")
      .where("createdAt", "<", cutoffDate)
      .where("read", "==", true)
      .limit(100)
      .get();

    const batch = db.batch();
    oldNotifications.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    if (!oldNotifications.empty) {
      await batch.commit();
      console.log(`Cleaned up ${oldNotifications.size} old notifications`);
    }

    // Clean up expired requests
    const expiredRequests = await db.collection("requests")
      .where("status", "==", "expired")
      .where("createdAt", "<", cutoffDate)
      .limit(50)
      .get();

    const requestBatch = db.batch();
    expiredRequests.docs.forEach((doc) => {
      requestBatch.delete(doc.ref);
    });

    if (!expiredRequests.empty) {
      await requestBatch.commit();
      console.log(`Cleaned up ${expiredRequests.size} expired requests`);
    }

  } catch (error) {
    console.error("Error during cleanup:", error);
  }

  return null;
});

// Generate item recommendations
export const generateRecommendations = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.data();
    const after = change.after.data();

    // Check if user preferences changed
    if (before?.preferences !== after?.preferences) {
      try {
        // Get user's browsing history and preferences
        const userPreferences = after?.preferences || {};
        const categories = userPreferences.categories || [];

        if (categories.length > 0) {
          // Get recommended items based on preferences
          const recommendedItems = await db.collection("items")
            .where("category", "in", categories.slice(0, 10)) // Firestore 'in' limit
            .where("status", "==", "available")
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

          // Store recommendations
          const recommendations = recommendedItems.docs.map(doc => ({
            itemId: doc.id,
            ...doc.data(),
            recommendedAt: admin.firestore.FieldValue.serverTimestamp()
          }));

          await db.collection("userRecommendations").doc(userId).set({
            recommendations: recommendations,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            basedOn: "preferences"
          });

          console.log(`Generated ${recommendations.length} recommendations for user ${userId}`);
        }
      } catch (error) {
        console.error("Error generating recommendations:", error);
      }
    }

    return null;
  });

// Helper function to verify PayFast payment
async function verifyPayFastPayment(paymentData: any): Promise<boolean> {
  // Implement PayFast payment verification logic here
  // This should include signature verification and amount checking
  // For now, return true for development
  console.log("Verifying PayFast payment:", paymentData);
  return true; // Replace with actual verification
}