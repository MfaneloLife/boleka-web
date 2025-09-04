import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clear existing data if needed (comment this out if you don't want to clear data)
  await prisma.review.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.request.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.businessProfile.deleteMany({});
  await prisma.clientProfile.deleteMany({});
  await prisma.user.deleteMany({});

  // Create users
  const password = await bcrypt.hash('password123', 10);
  
  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password,
      hasBusinessProfile: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password,
      hasBusinessProfile: true,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password,
      hasBusinessProfile: false,
    },
  });

  // Create business profiles
  await prisma.businessProfile.create({
    data: {
      userId: user1.id,
      businessName: 'John\'s Rentals',
      description: 'Quality items for rent',
      location: 'johannesburg',
      contactPhone: '123-456-7890',
    },
  });

  await prisma.businessProfile.create({
    data: {
      userId: user2.id,
      businessName: 'Jane\'s Sharing Service',
      description: 'Affordable sharing options',
      location: 'cape-town',
      contactPhone: '098-765-4321',
    },
  });

  // Create client profiles
  await prisma.clientProfile.create({
    data: {
      userId: user1.id,
      address: '123 Main St, Johannesburg',
      contactPhone: '123-456-7890',
    },
  });

  await prisma.clientProfile.create({
    data: {
      userId: user2.id,
      address: '456 Oak Ave, Cape Town',
      contactPhone: '098-765-4321',
    },
  });

  await prisma.clientProfile.create({
    data: {
      userId: user3.id,
      address: '789 Pine Rd, Durban',
      contactPhone: '111-222-3333',
    },
  });

  // Create items
  const item1 = await prisma.item.create({
    data: {
      title: 'Professional Camera',
      description: 'Canon EOS 5D Mark IV DSLR Camera with 24-105mm Lens. Perfect for professional photography and film projects.',
      price: 50.0,
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
        'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac'
      ]),
      location: 'johannesburg',
      category: 'electronics',
      ownerId: user1.id,
    },
  });

  const item2 = await prisma.item.create({
    data: {
      title: 'Mountain Bike',
      description: 'Trek Fuel EX 8 Mountain Bike. Perfect for trail riding and mountain adventures. Recently serviced and in excellent condition.',
      price: 35.0,
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e',
        'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91'
      ]),
      location: 'cape-town',
      category: 'sports-outdoors',
      ownerId: user2.id,
    },
  });

  const item3 = await prisma.item.create({
    data: {
      title: 'Portable Generator',
      description: 'Honda EU2200i Portable Inverter Generator. Quiet and fuel efficient, perfect for camping or emergency power needs.',
      price: 45.0,
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1554062572-68fb9e092d38'
      ]),
      location: 'johannesburg',
      category: 'tools-equipment',
      ownerId: user1.id,
    },
  });

  const item4 = await prisma.item.create({
    data: {
      title: 'Party Tent',
      description: '10x20 Outdoor Party Tent with Sidewalls. Great for events, parties, and gatherings of up to 30 people.',
      price: 75.0,
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1478827536114-da961b7f86d2'
      ]),
      location: 'cape-town',
      category: 'home-garden',
      ownerId: user2.id,
    },
  });

  // Create reviews
  await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Great camera, worked perfectly for my event!',
      itemId: item1.id,
      reviewerId: user3.id,
      ownerId: user1.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 4,
      comment: 'The bike was in good condition but the gears needed some adjustment.',
      itemId: item2.id,
      reviewerId: user1.id,
      ownerId: user2.id,
    },
  });

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: user1.id,
      type: 'REVIEW_RECEIVED',
      title: 'New Review',
      message: 'Bob Johnson left a 5-star review for your Professional Camera',
      isRead: false,
      relatedId: item1.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user2.id,
      type: 'REVIEW_RECEIVED',
      title: 'New Review',
      message: 'John Doe left a 4-star review for your Mountain Bike',
      isRead: true,
      relatedId: item2.id,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
