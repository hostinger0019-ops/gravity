/**
 * DEPRECATED: Supabase products table migration script.
 *
 * This script was used to create the products table in Supabase with RLS policies.
 * With the migration to the GPU backend, the products table is managed by the
 * GPU backend's database and the gpu.products.* API.
 *
 * No migration is needed — the GPU backend auto-creates tables on startup.
 */

console.log("⚠️  This script is deprecated.");
console.log("   The project has migrated from Supabase to the GPU backend.");
console.log("   The products table is now managed by the GPU backend.");
console.log("   No migration is needed — tables are auto-created on startup.");
