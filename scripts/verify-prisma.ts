import { PrismaClient } from '@prisma/client';

async function verify() {
  const prisma = new PrismaClient();
  
  try {
    const userCount = await prisma.user.count();
    const itemCount = await prisma.item.count();
    console.log(`✅ Connected. Found ${userCount} users and ${itemCount} items in database.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
