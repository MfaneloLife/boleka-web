import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Handle connection errors
prisma.$on('error', (e) => {
  console.error('Prisma Client Error:', e);
});

// Test database connection
export async function testDatabaseConnection() {
  try {
    // Try a simple query rather than just connect/disconnect
    await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Database connection successful');
    return { 
      success: true, 
      message: "Database connection successful",
      provider: process.env.DATABASE_PROVIDER || "unknown",
      url: process.env.DATABASE_URL ? (process.env.DATABASE_URL.startsWith('file:') ? 'SQLite file database' : 'Remote database') : "No database URL set"
    };
  } catch (error: any) {
    console.error('Database connection failed:', error);
    return { 
      success: false, 
      message: "Database connection failed", 
      error: error.message || String(error),
      provider: process.env.DATABASE_PROVIDER || "unknown",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }
}
