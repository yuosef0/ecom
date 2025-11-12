import { createClient } from "@supabase/supabase-js";

// محاولة قراءة الـ environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("=================================");
console.log("🔍 Supabase Client Test");
console.log("=================================\n");

console.log("1. Environment Variables Check:");
console.log("   URL:", supabaseUrl ? "✅ Found" : "❌ Not Found");
console.log("   Key:", supabaseAnonKey ? "✅ Found" : "❌ Not Found");

if (supabaseUrl) {
  console.log("\n2. URL Details:");
  console.log("   Full URL:", supabaseUrl);
  console.log("   Is Placeholder?", supabaseUrl.includes("your-supabase") ? "❌ YES!" : "✅ NO");
  console.log("   Starts with https?", supabaseUrl.startsWith("https://") ? "✅ YES" : "❌ NO");
}

if (supabaseAnonKey) {
  console.log("\n3. API Key Details:");
  console.log("   Length:", supabaseAnonKey.length);
  console.log("   First 20 chars:", supabaseAnonKey.substring(0, 20));
  console.log("   Is Placeholder?", supabaseAnonKey.includes("your-supabase") ? "❌ YES!" : "✅ NO");
  console.log("   Starts with 'eyJ'?", supabaseAnonKey.startsWith("eyJ") ? "✅ YES" : "❌ NO");
}

console.log("\n=================================");

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("❌ CRITICAL PROBLEM:");
  console.log("   Environment variables are NOT loaded!\n");
  console.log("💡 Solutions:");
  console.log("   1. Check .env.local exists in: /home/user/ecom/.env.local");
  console.log("   2. Stop dev server completely (Ctrl+C)");
  console.log("   3. Delete .next folder: rm -rf .next");
  console.log("   4. Restart: npm run dev");
} else if (supabaseUrl.includes("your-supabase") || supabaseAnonKey.includes("your-supabase")) {
  console.log("❌ CRITICAL PROBLEM:");
  console.log("   You're still using PLACEHOLDER values!\n");
  console.log("💡 Solution:");
  console.log("   1. Open .env.local file");
  console.log("   2. Replace with REAL values from Supabase");
  console.log("   3. Get them from: https://app.supabase.com → Settings → API");
} else {
  console.log("✅ Environment variables look GOOD!");

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ Supabase client created successfully!");

    // Test connection
    console.log("\n4. Testing Connection...");
    const { data, error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      console.log("❌ Connection Error:", error.message);
      console.log("   Code:", error.code);

      if (error.message.includes("No API key")) {
        console.log("\n💡 This means the API key is not being sent correctly!");
      }
    } else {
      console.log("✅ Connection test PASSED!");
    }
  } catch (e) {
    console.log("❌ Error creating client:", e);
  }
}

console.log("=================================");
