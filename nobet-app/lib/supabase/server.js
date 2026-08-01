import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server component ve server action'larda kullanılacak Supabase bağlantısı.
// Kullanıcının oturum bilgisini cookie üzerinden okur/yazar.
//
// React cache() ile sarılı (resmi Supabase+Next.js App Router deseni) —
// AYNI istek içinde (ör. bir sayfanın hem generateMetadata'sı hem kendisi)
// createClient() birden fazla çağrılırsa hep AYNI client instance'ı
// döner. Bu, o instance'ı kullanan cache()'li veri okumalarının (bkz.
// lib/db/cms.js getSiteContentCached) o istek içinde GERÇEKTEN
// tekilleşebilmesi için önkoşul — aksi halde her çağrı farklı bir client
// nesnesi üretir ve cache() anahtar eşleşmesi hiç tutmazdı.
export const createClient = cache(function createClient() {
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
});
