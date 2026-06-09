#!/bin/bash
# Seed database script
# Usage: ./scripts/seed-db.sh

set -e

echo "Seeding database..."

# Load environment
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Run seed with tsx
npx tsx --env-file=.env.local prisma/seed.ts

echo "Database seeded successfully!"
