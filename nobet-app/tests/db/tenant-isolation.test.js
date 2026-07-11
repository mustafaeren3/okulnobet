import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Bu test GERÇEK Supabase projesine bağlanır (env: NEXT_PUBLIC_SUPABASE_URL /
// NEXT_PUBLIC_SUPABASE_ANON_KEY). Amaç: RLS'in okul verilerini birbirinden
// gerçekten izole ettiğini kanıtlamak — A okulunun kullanıcısı B okulunun
// verisini asla göremesin.
//
// ÖNEMLİ — TEMİZLİK: Bu test anon key ile çalışır; anon key ile auth.users,
// schools veya school_users satırları SİLİNEMEZ (bu tablolarda authenticated
// rolüne delete izni yok, auth.users zaten sadece service_role ile silinir).
// Test verileri açıkça "ZZZ_TENANT_TEST_" öneki taşır — testten sonra
// Supabase Dashboard > Authentication ve Table Editor'den elle silinmelidir.
//
// "Confirm email" ayarı AÇIKSA bu test signUp sonrası session alamaz ve
// anlamlı bir hata ile başarısız olur (README'de belirtildiği gibi, pilot
// ortamda bu ayar kapalı tutulmalı).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const RUN_ID = Date.now();

function makeTestUser(label) {
  return {
    email: `zzz-tenant-test-${label}-${RUN_ID}@example.invalid`,
    password: `TestPass${RUN_ID}!`,
    schoolName: `ZZZ_TENANT_TEST_OKUL_${label.toUpperCase()}`,
  };
}

async function signUpAndRegisterSchool(client, user) {
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: user.email,
    password: user.password,
  });
  if (signUpError) {
    throw new Error(`signUp başarısız (${user.email}): ${signUpError.message}`);
  }
  if (!signUpData.session) {
    throw new Error(
      `signUp oturum döndürmedi (${user.email}). Supabase Auth > Providers > Email > ` +
        `"Confirm email" ayarı açık olabilir; pilot/test ortamında kapatılmalı.`
    );
  }
  const { data: schoolId, error: rpcError } = await client.rpc('register_school', {
    p_name: user.schoolName,
    p_city: 'Test',
    p_district: 'Test',
  });
  if (rpcError) {
    throw new Error(`register_school başarısız (${user.email}): ${rpcError.message}`);
  }
  return schoolId;
}

describe('tenant izolasyonu (RLS) — gerçek Supabase projesine karşı', () => {
  let clientA, clientB, schoolIdA, schoolIdB;

  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('.env.local içinde NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY bulunamadı.');
    }
    clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    schoolIdA = await signUpAndRegisterSchool(clientA, makeTestUser('a'));
    schoolIdB = await signUpAndRegisterSchool(clientB, makeTestUser('b'));

    // B'nin okuluna ait, A'nın asla göremeyeceği bir personel kaydı oluştur.
    const { error } = await clientB
      .from('staff')
      .insert({ school_id: schoolIdB, name: 'ZZZ_TENANT_TEST_OGRETMEN_B', num: 1 });
    if (error) throw new Error(`B okuluna personel eklenemedi: ${error.message}`);
  }, 30000);

  it('sağlık kontrolü: A kendi okulunun verisini görebiliyor (RLS her şeyi kapatmamış)', async () => {
    const { data, error } = await clientA.from('schools').select('id, name').eq('id', schoolIdA);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('ZZZ_TENANT_TEST_OKUL_A');
  });

  it('A, B okulunun schools satırını okuyamaz', async () => {
    const { data, error } = await clientA.from('schools').select('id, name').eq('id', schoolIdB);
    expect(error).toBeNull(); // RLS "satır yok" gibi davranır, hata fırlatmaz
    expect(data).toHaveLength(0);
  });

  it('A, B okulunun personel (staff) verisini okuyamaz', async () => {
    const { data, error } = await clientA.from('staff').select('*').eq('school_id', schoolIdB);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('A, B okulunun school_users satırını okuyamaz', async () => {
    const { data, error } = await clientA.from('school_users').select('*').eq('school_id', schoolIdB);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('A, B okulunun personeline yazma (insert) yapamaz', async () => {
    const { error } = await clientA
      .from('staff')
      .insert({ school_id: schoolIdB, name: 'ZZZ_TENANT_TEST_SIZINTI', num: 99 });
    expect(error).not.toBeNull();
  });
});
