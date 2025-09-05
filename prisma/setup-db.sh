#!/bin/bash

# This script is used by Vercel to set up the database during build

# Exit on error
set -e

echo "Running database setup script..."

# Using SQLite as the fixed provider
echo "Using provider: sqlite"

# Check if DATABASE_URL is set appropriately for SQLite
if [[ "$DATABASE_URL" != file:* ]]; then
  export DATABASE_URL="file:./prisma/prod.db"
  echo "Setting DATABASE_URL to $DATABASE_URL for SQLite"
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Deploy migrations
echo "Deploying database migrations..."
npx prisma migrate deploy

# Ensure the database file exists
echo "Ensuring SQLite database file exists..."
npx prisma db push --skip-generate

echo "Database setup completed successfully"
