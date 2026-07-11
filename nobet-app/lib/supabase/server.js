import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server component ve server action'larda kullanılacak Supabase bağlantısı.
// Kullanıcının oturum bilgisini cookie üzerinden okur/yazar.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (e) {
            // Server component içinden cookie set edilemez (Next.js kısıtı);
            // middleware bu durumu zaten yönetiyor, güvenle yok sayılabilir.
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (e) {}
        },
      },
    }
  );
}
