'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createTeacher, updateTeacher, deleteTeacher, createTeachersBulk, getTeachers } from '@/lib/db/teachers';
import { getUnavailableWeekdays, setUnavailableWeekdays } from '@/lib/db/teacherAvailability';
import { requireSchoolId } from '@/lib/db/schoolContext';
import { normalizeTr } from '@/lib/text';

// Müdür, müdür yardımcıları, rehber/psikolojik danışman, özel eğitim ve
// anaokulu (okul öncesi) öğretmenleri her zaman dışarıda bırakılır.
const EXCLUDE_KEYWORDS = ['müdür', 'rehber', 'danışman', 'özel eğitim', 'okul öncesi', 'anaokulu'];

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

// MEB k12.tr okul siteleri en az iki farklı şablon kullanıyor (gerçek
// okul sitelerinde doğrulandı — tek bir sabit şablona güvenilemez):
//   1) <a href="..." title="ROL">AD SOYAD<br /><span>ROL</a>  (span/br'lı)
//   2) <a href='...' title='ROL'>AD SOYAD</a>                  (span/br'sız)
// Her iki durumda da rol her zaman title özniteliğinde, isim her zaman
// açılış etiketinden sonraki ilk düz metin — <br>/<span> kısmı varsa
// (grup 1'in role'ü ile aynı bilgiyi tekrar eder) yok sayılan isteğe
// bağlı bir grup olarak eşleştirilir.
const PERSON_RE = /<a\s+href=["'][^"']*["']\s+title=["']([^"']*)["']>([^<]*)(?:<br\s*\/?>\s*<span>[^<]*)?<\/a>/gi;

export async function addTeacher(payload) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const teacher = await createTeacher(supabase, schoolId, payload);
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
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

  let existing;
  try {
    existing = await getTeachers(supabase, schoolId);
  } catch (e) {
    return { error: e.message };
  }
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

  revalidatePath('/dashboard');
  return { added: inserted, totalFound: found.length, skipped: found.length - inserted.length };
}

export async function saveTeacherAvailability(teacherId, weekdays) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const rows = await setUnavailableWeekdays(supabase, schoolId, teacherId, weekdays);
    revalidatePath('/dashboard');
    return { rows };
  } catch (e) {
    return { error: e.message };
  }
}

// Not: eski öğretmen bazlı "rotasyona dahil et / başlangıç bölgesi"
// action'ları kaldırıldı — rotasyon artık motorun kendisinde, tüm
// çizelge için otomatik (bkz. lib/db/bulkSchedule.js: haftalık sıralı
// yer değişimi). İdareci sırayı ilk haftayı elle düzenleyerek belirler.
