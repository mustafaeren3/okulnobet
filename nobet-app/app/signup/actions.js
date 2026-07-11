'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signUpAndRegisterSchool(formData) {
  const supabase = createClient();

  const email = formData.get('email');
  const password = formData.get('password');
  const okulAdi = formData.get('okulAdi');
  const il = formData.get('il');
  const ilce = formData.get('ilce');

  // 1) Kullanıcı hesabı oluştur
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) {
    return { error: authError.message };
  }
  if (!authData.session) {
    // Supabase projesinde "Confirm email" açıksa buraya düşer.
    return {
      error:
        'Kayıt oluşturuldu ama e-posta onayı gerekiyor. Pilot testler için Supabase Auth ayarlarından "Confirm email" seçeneğini kapatabilirsin.',
    };
  }

  // 2) Okulu oluştur + kullanıcıyı bağla (güvenli RPC fonksiyonu ile, tek adımda)
  const { error: rpcError } = await supabase.rpc('register_school', {
    p_name: okulAdi,
    p_city: il,
    p_district: ilce,
  });
  if (rpcError) {
    return { error: rpcError.message };
  }

  redirect('/dashboard');
}
