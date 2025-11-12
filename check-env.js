// Test script to check environment variables
console.log("=================================");
console.log("Checking Environment Variables");
console.log("=================================");
console.log("");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("NEXT_PUBLIC_SUPABASE_URL:", url ? "✅ Found" : "❌ Missing");
if (url) {
  console.log("  Value starts with:", url.substring(0, 30) + "...");
  console.log("  Is placeholder?", url.includes("your-supabase-url") ? "❌ YES - Still placeholder!" : "✅ NO - Looks good");
}

console.log("");

console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", key ? "✅ Found" : "❌ Missing");
if (key) {
  console.log("  Length:", key.length, "characters");
  console.log("  Starts with:", key.substring(0, 20) + "...");
  console.log("  Is placeholder?", key.includes("your-supabase-anon-key") ? "❌ YES - Still placeholder!" : "✅ NO - Looks good");
}

console.log("");
console.log("=================================");

if (!url || !key) {
  console.log("❌ PROBLEM: Environment variables not loaded!");
  console.log("");
  console.log("Solutions:");
  console.log("1. Make sure .env.local exists in project root");
  console.log("2. Restart dev server completely (stop and start)");
  console.log("3. Check file has correct syntax (no spaces around =)");
} else if (url.includes("your-supabase-url") || key.includes("your-supabase-anon-key")) {
  console.log("❌ PROBLEM: Still using placeholder values!");
  console.log("");
  console.log("You need to replace with REAL values from Supabase:");
  console.log("1. Go to https://app.supabase.com");
  console.log("2. Settings → API");
  console.log("3. Copy URL and anon key");
  console.log("4. Update .env.local file");
} else {
  console.log("✅ Environment variables look good!");
}

console.log("=================================");
