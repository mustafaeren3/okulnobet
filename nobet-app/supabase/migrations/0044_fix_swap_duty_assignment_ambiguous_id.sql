-- ═══════════════════════════════════════════════════════════════
-- DÜZELTME: swap_duty_assignment'ta "column reference id is ambiguous"
-- ═══════════════════════════════════════════════════════════════
-- 0042'deki gövdede `where id = p_new_teacher_id` UNQUALIFIED (tablo
-- öneki olmadan) yazılmıştı. `returns table (id uuid, ...)` bir OUT
-- parametresi olarak `id` adında bir PL/pgSQL değişkeni ZATEN tanımlıyor
-- — fonksiyon gövdesindeki gömülü SQL'de öneksiz `id` bu OUT parametresi
-- ile `teachers.id` sütunu arasında belirsiz kalıyor, canlıda gerçek bir
-- "column reference is ambiguous" hatası olarak doğrulandı (tests/db/
-- atomicSwap.test.js). Zaten uygulanmış 0042'nin dosyası DEĞİŞTİRİLMEDİ
-- (migration geçmişi asla elle düzenlenmez) — bunun yerine `create or
-- replace function` ile takip eden bu migration düzeltiyor.
create or replace function public.swap_duty_assignment(p_assignment_id uuid, p_new_teacher_id uuid)
returns table (
  id uuid,
  duty_date date,
  is_manual boolean,
  teacher_id uuid,
  teacher_full_name text,
  zone_id uuid,
  zone_name text
)
language plpgsql
as $$
declare
  v_school_id uuid;
  v_zone_id uuid;
  v_duty_date date;
  v_slot_key text;
  v_new_id uuid;
begin
  select da.school_id, da.zone_id, da.duty_date, da.slot_key
    into v_school_id, v_zone_id, v_duty_date, v_slot_key
  from public.duty_assignments da
  where da.id = p_assignment_id
  for update;

  if not found then
    raise exception 'Atama bulunamadı.';
  end if;
  if v_school_id <> public.current_school_id() then
    raise exception 'Bu atama başka bir okula ait.';
  end if;

  if not exists (
    select 1 from public.teachers t
    where t.id = p_new_teacher_id and t.school_id = public.current_school_id()
  ) then
    raise exception 'Seçilen öğretmen bu okula ait değil.';
  end if;

  delete from public.duty_assignments da where da.id = p_assignment_id;

  insert into public.duty_assignments (school_id, teacher_id, zone_id, duty_date, slot_key, is_manual)
  values (v_school_id, p_new_teacher_id, v_zone_id, v_duty_date, v_slot_key, true)
  returning duty_assignments.id into v_new_id;

  return query
    select da.id, da.duty_date, da.is_manual, da.teacher_id, t.full_name, da.zone_id, z.name
    from public.duty_assignments da
    join public.teachers t on t.id = da.teacher_id
    join public.duty_zones z on z.id = da.zone_id
    where da.id = v_new_id;
end;
$$;

grant execute on function public.swap_duty_assignment(uuid, uuid) to authenticated;
