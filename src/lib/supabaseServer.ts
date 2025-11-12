import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for server-side operations (API routes)
 * This client uses the user's session from cookies for authenticated requests
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          cookie: cookieStore
            .getAll()
            .map((cookie) => `${cookie.name}=${cookie.value}`)
            .join('; '),
        },
      },
    }
  );

  // Try to get session from cookies
  const allCookies = cookieStore.getAll();

  // Find Supabase auth cookies (they typically start with 'sb-' followed by project ref)
  const authCookie = allCookies.find(
    (cookie) => cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
  );

  if (authCookie) {
    try {
      const sessionData = JSON.parse(authCookie.value);
      if (sessionData.access_token && sessionData.refresh_token) {
        await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
        });
      }
    } catch (e) {
      // If parsing fails, the cookie might be in a different format
      // Continue without session
      console.error('Failed to parse auth cookie:', e);
    }
  }

  return supabase;
}

/**
 * Alternative: Create Supabase client using service role key (bypasses RLS)
 * Only use this for admin operations where you trust the calling code
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
