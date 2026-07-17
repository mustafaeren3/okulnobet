'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createTeacher, updateTeacher, deleteTeacher, createTeachersBulk, getTeachers } from '@/lib/db/teachers';
import { getUnavailableWeekdays, setUnavailableWeekdays } from '@/lib/db/teacherAvailability';

// Müdür, müdür yardımcıları, rehber/psikolojik danışman, özel eğitim ve
// anaokulu (okul öncesi) öğretmenleri her zaman dışarıda bırakılır.
const EXCLUDE_KEYWORDS = ['müdür', 'rehber', 'danışman', 'özel eğitim', 'okul öncesi', 'anaokulu'];

function normalizeTr(s) {
  return s.toLocaleLowerCase('tr-TR');
}

function isIncludedRole(role) {
  const norm = normalizeTr(role);
  if (!norm.includes('öğretmen')) return false;
  return !EXCLUDE_KEYWORDS.some((k) => norm.includes(normalizeTr(k)));
}

// "1/A SINIF ÖĞRETMENİ" gibi sınıf+şube bilgisi taşıyan roller 'sınıf'
// branşına indirgenir (duty_zones.allowed_branches/blocked_branches
// bunun gibi genel branş adlarıyla eşleşiyor, "1/A" gibi özel şube
// bilgisiyle değil). Diğer roller sondaki "öğretmeni/öğretmenleri"
// ekinden arındırılıp branş adı olarak kullanılır.
function normalizeBranch(role) {
  const trimmed = role.trim();
  // JS'in regex /i bayrağı Türkçe'ye özgü ı/İ eşleşmesini bilmiyor
  // ("SINIF" büyük harfi ile "sınıf" küçük harfi /i ile eşleşmiyor),
  // bu yüzden önce tr-TR ile küçük harfe çevirip öyle eşleştiriyoruz.
  const lower = normalizeTr(trimmed);
  if (lower.includes('sınıf öğretmen')) return 'sınıf';
  const suffixMatch = lower.match(/\s*öğretmen(i|leri)?\s*$/);
  if (suffixMatch) {
    const stripped = trimmed.slice(0, suffixMatch.index).trim();
    return stripped || trimmed;
  }
  return trimmed;
}

// MEB k12.tr okul siteleri ortak bir şablon kullanır: teşkilat şeması
// sayfasında her kişi <a href="..." title="ROL">AD SOYAD<br /><span>ROL</a>
// biçiminde listelenir. Bu yapı ilkokul/ortaokul/lise fark etmeksizin aynı.
const PERSON_RE = /<a\s+href=["'][^"']*["']\s+title=["']([^"']*)["']>([^<]*)<br\s*\/?>\s*<span>([^<]*)<\/a>/gi;

async function requireSchoolId(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Giriş yapılmamış.');
  const { data: schoolUser } = await supabase
    .from('school_users')
    .select('school_id')
    .eq('user_id', user.id)
    .single();
  if (!schoolUser) throw new Error('Kullanıcı bir okula bağlı değil.');
  return schoolUser.school_id;
}

export async function addTeacher(payload) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const teacher = await createTeacher(supabase, schoolId, payload);
    revalidatePath('/teachers');
    return { teacher };
  } catch (e) {
    return { error: e.message };
  }
}

export async function editTeacher(teacherId, patch) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    const teacher = await updateTeacher(supabase, teacherId, patch);
    revalidatePath('/teachers');
    return { teacher };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeTeacher(teacherId) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    await deleteTeacher(supabase, teacherId);
    revalidatePath('/teachers');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchTeacherAvailability(teacherId) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    const weekdays = await getUnavailableWeekdays(supabase, teacherId);
    return { weekdays };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchTeskilatOgretmenleri(url) {
  const supabase = createClient();
  let schoolId;
  try {
    schoolId = await requireSchoolId(supabase);
  } catch (e) {
    return { error: e.message };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { error: 'Geçersiz URL.' };
  }
  if (!parsed.hostname.endsWith('.meb.k12.tr')) {
    return { error: 'Sadece *.meb.k12.tr adresleri desteklenir.' };
  }

  let html;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(parsed.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { error: `Sayfa alınamadı (HTTP ${res.status}).` };
    html = await res.text();
  } catch (e) {
    return { error: 'Sayfaya ulaşılamadı: ' + e.message };
  }

  const found = [];
  let m;
  while ((m = PERSON_RE.exec(html))) {
    const role = m[1].trim();
    const name = m[2].trim();
    if (name && role && isIncludedRole(role)) {
      found.push({ name, role });
    }
  }

  if (!found.length) {
    return { error: 'Sayfada uygun öğretmen bulunamadı. Bu sitenin yapısı desteklenen şablondan farklı olabilir.' };
  }

  const existing = await getTeachers(supabase, schoolId);
  const existingNames = new Set(existing.map((t) => normalizeTr(t.full_name)));

  const rows = [];
  for (const p of found) {
    const key = normalizeTr(p.name);
    if (existingNames.has(key)) continue;
    existingNames.add(key);
    rows.push({ full_name: p.name, branch: normalizeBranch(p.role) });
  }

  if (!rows.length) {
    return { added: [], totalFound: found.length, skipped: found.length };
  }

  let inserted;
  try {
    inserted = await createTeachersBulk(supabase, schoolId, rows);
  } catch (e) {
    return { error: e.message };
  }

  revalidatePath('/teachers');
  return { added: inserted, totalFound: found.length, skipped: found.length - inserted.length };
}

export async function saveTeacherAvailability(teacherId, weekdays) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const rows = await setUnavailableWeekdays(supabase, schoolId, teacherId, weekdays);
    revalidatePath('/teachers');
    return { rows };
  } catch (e) {
    return { error: e.message };
  }
}
