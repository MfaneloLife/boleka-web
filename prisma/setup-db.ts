// This script automates the database setup for production environments
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Starting database setup...');
  
  // Using SQLite as the fixed provider
  console.log(`Using database provider: sqlite`);
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Database connection successful!');
    
    // For SQLite, check if database file exists
    const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
    const dbPath = dbUrl.replace('file:./', '');
    const fullDbPath = path.join(process.cwd(), dbPath);
    
    console.log(`SQLite database path: ${fullDbPath}`);
    
    // Create directory if it doesn't exist
    const dbDir = path.dirname(fullDbPath);
    if (!fs.existsSync(dbDir)) {
      console.log(`Creating database directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    if (!fs.existsSync(fullDbPath)) {
      console.log('Creating database file...');
      // The file will be created when we run queries
    }
    
    // Check if users table exists by trying to count users
    try {
      const userCount = await prisma.user.count();
      console.log(`Database schema exists. User count: ${userCount}`);
    } catch (error) {
      console.log('Schema may not exist yet. Will be created by migrations.');
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

main();
