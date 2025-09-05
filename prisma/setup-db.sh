#!/bin/bash

# This script is used by Vercel to set up the database during build

# Exit on error
set -e

echo "Running database setup script..."

# Check if DATABASE_PROVIDER is set, default to sqlite
if [ -z "$DATABASE_PROVIDER" ]; then
  export DATABASE_PROVIDER="sqlite"
  echo "DATABASE_PROVIDER not set, defaulting to 'sqlite'"
else
  echo "Using DATABASE_PROVIDER: $DATABASE_PROVIDER"
fi

# Check if DATABASE_URL is set appropriately for the provider
if [ "$DATABASE_PROVIDER" = "sqlite" ] && [[ "$DATABASE_URL" != file:* ]]; then
  export DATABASE_URL="file:./prisma/dev.db"
  echo "Setting DATABASE_URL to $DATABASE_URL for SQLite"
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Deploy migrations
echo "Deploying database migrations..."
npx prisma migrate deploy

# For SQLite, ensure the database file exists
if [ "$DATABASE_PROVIDER" = "sqlite" ]; then
  echo "Ensuring SQLite database file exists..."
  npx prisma db push --skip-generate
fi

echo "Database setup completed successfully"
