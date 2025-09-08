const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const bcrypt = require('bcrypt');

// Initialize Firebase Admin
const app = initializeApp({
  projectId: "bolekaweb"
});

const db = getFirestore(app);

async function seedFirestore() {
  console.log('Starting Firebase Firestore seeding...');

  try {
    // Create sample users with hashed passwords
    const password = await bcrypt.hash('password123', 10);
    
    // User 1: John Doe (Business)
    const user1Ref = await db.collection('users').add({
      name: 'John Doe',
      email: 'john@example.com',
      password,
      hasBusinessProfile: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Created user:', user1Ref.id);

    // User 2: Jane Smith (Business)
    const user2Ref = await db.collection('users').add({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password,
      hasBusinessProfile: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Created user:', user2Ref.id);

    // User 3: Bob Johnson (Client)
    const user3Ref = await db.collection('users').add({
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password,
      hasBusinessProfile: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Created user:', user3Ref.id);

    // Create business profiles
    await db.collection('businessProfiles').add({
      userId: user1Ref.id,
      businessName: 'Doe Equipment Rentals',
      description: 'Professional equipment rental services',
      category: 'equipment',
      address: '123 Main St, City',
      phone: '+1234567890',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await db.collection('businessProfiles').add({
      userId: user2Ref.id,
      businessName: 'Smith Tool Rentals',
      description: 'Quality tools for all your projects',
      category: 'tools',
      address: '456 Oak Ave, City',
      phone: '+1234567891',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create client profile
    await db.collection('clientProfiles').add({
      userId: user3Ref.id,
      firstName: 'Bob',
      lastName: 'Johnson',
      phone: '+1234567892',
      address: '789 Pine St, City',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create sample items
    await db.collection('items').add({
      name: 'Power Drill',
      description: 'Professional grade power drill with multiple bits',
      category: 'tools',
      condition: 'excellent',
      dailyPrice: 25.00,
      isAvailable: true,
      images: [],
      ownerId: user1Ref.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await db.collection('items').add({
      name: 'Ladder',
      description: '10ft aluminum extension ladder',
      category: 'equipment',
      condition: 'good',
      dailyPrice: 15.00,
      isAvailable: true,
      images: [],
      ownerId: user2Ref.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await db.collection('items').add({
      name: 'Pressure Washer',
      description: 'High pressure washer for cleaning',
      category: 'equipment',
      condition: 'excellent',
      dailyPrice: 35.00,
      isAvailable: true,
      images: [],
      ownerId: user1Ref.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Firestore seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding Firestore:', error);
  }
}

// Run the seed function
seedFirestore().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
