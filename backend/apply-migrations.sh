#!/bin/bash

echo "🔄 Applying Prisma migrations..."
echo ""

# Apply all pending migrations
npx prisma migrate deploy

echo ""
echo "✅ Migrations applied!"
echo ""

# Regenerate Prisma client
echo "🔄 Regenerating Prisma client..."
npx prisma generate

echo ""
echo "✅ Prisma client regenerated!"
echo ""
echo "🎉 Done! Restart your backend server now."
