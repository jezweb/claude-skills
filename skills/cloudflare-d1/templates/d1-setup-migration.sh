#!/bin/bash
#
# Cloudflare D1 Setup and Migration Workflow
#
# This script demonstrates the complete D1 workflow:
# 1. Create a D1 database
# 2. Configure bindings
# 3. Create and apply migrations
# 4. Query the database
#
# Usage:
#   chmod +x d1-setup-migration.sh
#   ./d1-setup-migration.sh my-app-database
#

set -e  # Exit on error

DATABASE_NAME="${1:-my-database}"

echo "========================================="
echo "Cloudflare D1 Setup and Migration"
echo "========================================="
echo ""

# Step 1: Create D1 Database
echo "📦 Step 1: Creating D1 database '$DATABASE_NAME'..."
echo ""

npx wrangler d1 create "$DATABASE_NAME"

echo ""
echo "✅ Database created!"
echo ""
echo "📝 IMPORTANT: Copy the output above and add to your wrangler.jsonc:"
echo ""
echo '  {
    "d1_databases": [
      {
        "binding": "DB",
        "database_name": "'"$DATABASE_NAME"'",
        "database_id": "<UUID_FROM_OUTPUT_ABOVE>",
        "preview_database_id": "local-dev-db"
      }
    ]
  }'
echo ""
read -p "Press ENTER when you've added the binding to wrangler.jsonc..."

# Step 2: Create Migrations Directory
echo ""
echo "📁 Step 2: Setting up migrations directory..."
mkdir -p migrations

# Step 3: Create Initial Migration
echo ""
echo "🔨 Step 3: Creating initial migration..."
echo ""

npx wrangler d1 migrations create "$DATABASE_NAME" create_initial_schema

# Find the created migration file (most recent .sql file in migrations/)
MIGRATION_FILE=$(ls -t migrations/*.sql | head -n1)

echo ""
echo "✅ Migration file created: $MIGRATION_FILE"
echo ""
echo "📝 Add your schema to this file. Example:"
echo ""
echo "  DROP TABLE IF EXISTS users;
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  PRAGMA optimize;"
echo ""
read -p "Press ENTER when you've edited the migration file..."

# Step 4: Apply Migration Locally
echo ""
echo "🔧 Step 4: Applying migration to LOCAL database..."
echo ""

npx wrangler d1 migrations apply "$DATABASE_NAME" --local

echo ""
echo "✅ Local migration applied!"

# Step 5: Verify Local Database
echo ""
echo "🔍 Step 5: Verifying local database..."
echo ""

npx wrangler d1 execute "$DATABASE_NAME" --local --command "SELECT name FROM sqlite_master WHERE type='table'"

# Step 6: Seed Local Database (Optional)
echo ""
echo "🌱 Step 6: Would you like to seed the local database with test data?"
read -p "Seed database? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Creating seed data..."

  cat > seed.sql << 'EOF'
-- Seed data for testing
INSERT INTO users (email, username, created_at) VALUES
  ('alice@example.com', 'alice', unixepoch()),
  ('bob@example.com', 'bob', unixepoch()),
  ('charlie@example.com', 'charlie', unixepoch());
EOF

  npx wrangler d1 execute "$DATABASE_NAME" --local --file=seed.sql

  echo ""
  echo "✅ Seed data inserted!"
  echo ""
  echo "🔍 Verifying data..."
  npx wrangler d1 execute "$DATABASE_NAME" --local --command "SELECT * FROM users"
fi

# Step 7: Apply to Production (Optional)
echo ""
echo "🚀 Step 7: Ready to apply migration to PRODUCTION?"
echo ""
echo "⚠️  WARNING: This will modify your production database!"
read -p "Apply to production? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Applying migration to production..."
  npx wrangler d1 migrations apply "$DATABASE_NAME" --remote

  echo ""
  echo "✅ Production migration applied!"
else
  echo "Skipping production migration."
  echo ""
  echo "To apply later, run:"
  echo "  npx wrangler d1 migrations apply $DATABASE_NAME --remote"
fi

# Summary
echo ""
echo "========================================="
echo "✅ D1 Setup Complete!"
echo "========================================="
echo ""
echo "Database: $DATABASE_NAME"
echo "Local database: ✅"
echo "Migrations: ✅"
echo ""
echo "📚 Next steps:"
echo ""
echo "1. Start dev server:"
echo "   npm run dev"
echo ""
echo "2. Query from your Worker:"
echo '   const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
     .bind("alice@example.com")
     .first();'
echo ""
echo "3. Create more migrations as needed:"
echo "   npx wrangler d1 migrations create $DATABASE_NAME <migration_name>"
echo ""
echo "4. View all tables:"
echo "   npx wrangler d1 execute $DATABASE_NAME --local --command \"SELECT name FROM sqlite_master WHERE type='table'\""
echo ""
echo "========================================="
