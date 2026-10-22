import { createBrowserClient } from '@supabase/ssr'

// Fungsi ini digunakan di dalam Client Components (React Hooks, Event Handlers)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}