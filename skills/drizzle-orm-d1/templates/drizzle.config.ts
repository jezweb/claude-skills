import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit Configuration for Cloudflare D1
 *
 * This configuration uses the D1 HTTP driver to connect to your Cloudflare D1
 * database for running migrations, introspection, and Drizzle Studio.
 *
 * IMPORTANT: Never commit credentials to version control!
 * Use environment variables for all sensitive data.
 */
export default defineConfig({
  // Schema location (can be a single file or directory)
  schema: './src/db/schema.ts',

  // Output directory for generated migrations
  // This should match the migrations_dir in wrangler.jsonc
  out: './migrations',

  // Database dialect (D1 is SQLite-based)
  dialect: 'sqlite',

  // Driver for connecting to D1 via HTTP API
  driver: 'd1-http',

  // Cloudflare credentials (from environment variables)
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },

  // Enable verbose output for debugging
  verbose: true,

  // Enable strict mode (recommended)
  strict: true,
});

/**
 * How to get credentials:
 *
 * 1. CLOUDFLARE_ACCOUNT_ID
 *    - Go to Cloudflare Dashboard
 *    - Click on your account
 *    - Account ID is shown in the right sidebar
 *
 * 2. CLOUDFLARE_DATABASE_ID
 *    - Run: wrangler d1 list
 *    - Find your database and copy the Database ID
 *    - Or create a new database: wrangler d1 create my-database
 *
 * 3. CLOUDFLARE_D1_TOKEN
 *    - Go to Cloudflare Dashboard → My Profile → API Tokens
 *    - Click "Create Token"
 *    - Use template "Edit Cloudflare Workers" or create custom token
 *    - Make sure it has D1 permissions
 */

/**
 * Create a .env file in your project root:
 *
 * CLOUDFLARE_ACCOUNT_ID=your-account-id-here
 * CLOUDFLARE_DATABASE_ID=your-database-id-here
 * CLOUDFLARE_D1_TOKEN=your-api-token-here
 *
 * Never commit .env to Git! Add it to .gitignore.
 */

/**
 * Usage:
 *
 * # Generate migration from schema changes
 * npx drizzle-kit generate
 *
 * # Push schema directly to database (dev only, not recommended for prod)
 * npx drizzle-kit push
 *
 * # Open Drizzle Studio to browse your database
 * npx drizzle-kit studio
 *
 * # Introspect existing database
 * npx drizzle-kit introspect
 */
