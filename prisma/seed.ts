import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      role: 'user',
      profileCompleted: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
      role: 'user',
      profileCompleted: true,
    },
  });

  // Create sample items
  const item1 = await prisma.item.create({
    data: {
      title: 'Bicycle',
      description: 'Mountain bike in great condition',
      category: 'Sports',
      condition: 'excellent',
      quantity: 1,
      price: 50.0,
      itemType: 'BOTH',
      allowCollection: true,
      allowDelivery: true,
      deliveryFee: 10.0,
      address: '123 Main St',
      lat: -25.7482,
      lng: 28.2293,
      userId: user1.id,
      isActive: true,
    },
  });

  const item2 = await prisma.item.create({
    data: {
      title: 'Laptop',
      description: 'Dell XPS 13 laptop',
      category: 'Electronics',
      condition: 'good',
      quantity: 1,
      price: 800.0,
      itemType: 'SELLING',
      allowCollection: false,
      allowDelivery: true,
      deliveryFee: 50.0,
      address: '456 Oak Ave',
      lat: -25.7505,
      lng: 28.2359,
      userId: user2.id,
      isActive: true,
    },
  });

  console.log({ user1, user2, item1, item2 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
