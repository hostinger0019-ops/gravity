/**
 * DEPRECATED: Supabase database check script.
 *
 * This script was used to verify Supabase tables (pages, assets, knowledge_chunks)
 * and storage buckets. With the migration to the GPU backend, these tables are
 * managed by the GPU backend's SQLite/PostgreSQL database.
 *
 * To check GPU backend health, use: curl http://<GPU_BACKEND_URL>/health
 */

console.log("⚠️  This script is deprecated.");
console.log("   The project has migrated from Supabase to the GPU backend.");
console.log("   To check GPU backend health, use:");
console.log("     curl http://<GPU_BACKEND_URL>/health");
console.log("");
console.log("   Tables are now managed by the GPU backend.");
