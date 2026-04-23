#!/bin/bash
# Run from ~/rentpro/apps/api
set -e

echo "Step 1: Adding passwordHash to User schema..."
python3 << 'PYEOF'
import os
path = os.path.expanduser('~/rentpro/apps/api/prisma/schema.prisma')
with open(path, 'r') as f:
    content = f.read()

# Add passwordHash after clerkId
content = content.replace(
    '  clerkId    String     @unique\n  email      String     @unique',
    '  clerkId    String?    @unique\n  email      String     @unique\n  passwordHash String?'
)

with open(path, 'w') as f:
    f.write(content)
print("schema.prisma updated")
PYEOF

echo "Step 2: Running migration..."
cd ~/rentpro/apps/api
npx prisma migrate dev --name add_driver_password
npx prisma generate

echo "Step 3: Installing bcrypt..."
cd ~/rentpro/apps/api
npm install bcrypt
npm install --save-dev @types/bcrypt

echo ""
echo "Done. Now apply the backend auth files:"
echo "  bash ~/rentpro/apply-driver-auth.sh"

