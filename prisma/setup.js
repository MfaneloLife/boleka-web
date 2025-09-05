// This script is used to set up the database during deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Using SQLite as the fixed provider
const databaseProvider = 'sqlite';
console.log(`Setting up database with provider: ${databaseProvider}`);

try {
  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Check if DATABASE_URL is properly formatted for SQLite
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  
  // If DATABASE_URL doesn't start with file:, force it to use a local SQLite file
  if (!dbUrl.startsWith('file:')) {
    console.log('DATABASE_URL is not configured for SQLite. Setting to file:./prisma/prod.db');
    process.env.DATABASE_URL = 'file:./prisma/prod.db';
  }

  const dbPath = process.env.DATABASE_URL.replace('file:./', '');
  const fullDbPath = path.join(process.cwd(), dbPath);

  // Create SQLite database directory if it doesn't exist
  const dbDir = path.dirname(fullDbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Deploy the schema (run migrations or create schema)
  console.log('Deploying Prisma schema...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  // If db file still doesn't exist, create a blank database file
  if (!fs.existsSync(fullDbPath)) {
    console.log(`Creating empty database file: ${fullDbPath}`);
    execSync(`npx prisma db push --skip-generate`, { stdio: 'inherit' });
  }

  console.log('Database setup completed successfully');
} catch (error) {
  console.error('Error setting up database:', error);
  process.exit(1);
}
