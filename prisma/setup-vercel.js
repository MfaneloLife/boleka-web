// This script is specifically for setting up the database in Vercel deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Force SQLite for Vercel deployments
process.env.DATABASE_PROVIDER = 'sqlite';
process.env.DATABASE_URL = 'file:./prisma/prod.db';

console.log(`Setting up database for Vercel deployment with SQLite`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);

try {
  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Ensure the database directory exists
  const dbPath = 'prisma/prod.db';
  const fullDbPath = path.join(process.cwd(), dbPath);
  const dbDir = path.dirname(fullDbPath);
  
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Deploy migrations
  console.log('Deploying Prisma schema...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  // Push schema changes and create DB if needed
  console.log('Ensuring database is created...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });

  console.log('Database setup completed successfully');
} catch (error) {
  console.error('Error setting up database:', error);
  process.exit(1);
}
