'use server';

import { createClient } from '@/lib/supabase/server';
import { PALETTE } from '@/lib/engine/schedule';

// Müdür yardımcıları, rehber/psikolojik danışman, özel eğitim ve
// anaokulu (okul öncesi) öğretmenleri her zaman dışarıda bırakılır.
const EXCLUDE_KEYWORDS = ['müdür yardımcısı', 'rehber', 'danışman', 'özel eğitim', 'okul öncesi'];

function normalizeTr(s) {
  return s.toLocaleLowerCase('tr-TR');
}

function isIncludedRole(role) {
  const norm = normalizeTr(role);
  if (!norm.includes('öğretmen')) return false;
  return !EXCLUDE_KEYWORDS.some((k) => norm.includes(normalizeTr(k)));
}

// MEB k12.tr okul siteleri ortak bir şablon kullanır: teşkilat şeması
// sayfasında her kişi <a href="..." title="ROL">AD SOYAD<br /><span>ROL</a>
// biçiminde listelenir. Bu yapı ilkokul/ortaokul/lise fark etmeksizin aynı.
const PERSON_RE = /<a\s+href=["'][^"']*["']\s+title=["']([^"']*)["']>([^<]*)<br\s*\/?>\s*<span>([^<]*)<\/a>/gi;

export async function fetchTeskilatOgretmenleri(schoolId, url) {
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

  const supabase = createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('staff')
    .select('name, color')
    .eq('school_id', schoolId);
  if (fetchError) return { error: fetchError.message };

  const existingNames = new Set((existing || []).map((p) => p.name.toLocaleUpperCase('tr-TR')));
  const usedColors = (existing || []).map((p) => p.color);
  let num = (existing || []).length;

  const rows = [];
  for (const p of found) {
    const upperName = p.name.toLocaleUpperCase('tr-TR');
    if (existingNames.has(upperName)) continue;
    existingNames.add(upperName);
    num += 1;
    const color = PALETTE.find((c) => !usedColors.includes(c)) || PALETTE[Math.floor(Math.random() * PALETTE.length)];
    usedColors.push(color);
    rows.push({ school_id: schoolId, name: upperName, num, restrict_code: null, color });
  }

  await supabase.from('settings').update({ teskilat_url: parsed.toString() }).eq('school_id', schoolId);

  if (!rows.length) {
    return { added: [], totalFound: found.length, skipped: found.length };
  }

  const { data: inserted, error: insertError } = await supabase.from('staff').insert(rows).select();
  if (insertError) return { error: insertError.message };

  return { added: inserted, totalFound: found.length, skipped: found.length - inserted.length };
}
