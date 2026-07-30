-- Okul bazlı nöbet dönme düzeni (kullanıcının verdiği ürün tanımı):
--   haftalik_yer      : her hafta bölge +1 ileri; tüm bölgeler dolaşılınca
--                       (bölge listesi sarınca) nöbet GÜNÜ de +1 ilerler.
--   aylik_ayni_gun    : her takvim ayında bölge +1 ileri, gün sabit.
--   aylik_farkli_gun  : her takvim ayında bölge +1 VE gün +1 ileri.
-- Tatil/kapalı dönemlerde sıra İLERLEMEZ (motor sadece işlenebilir
-- hafta/ayları sayar) — bu sütun sadece hangi düzenin geçerli olduğunu
-- söyler, sıra durumu duty_assignments'ın kendisinden türetilir.

alter table public.schools
  add column if not exists rotation_mode text not null default 'haftalik_yer'
  check (rotation_mode in ('haftalik_yer', 'aylik_ayni_gun', 'aylik_farkli_gun'));

-- schools tablosunda bugüne kadar sadece select izni vardı. İdarecinin
-- dönme düzenini değiştirebilmesi için update politikası + SADECE bu
-- sütuna sütun-bazlı grant açıyoruz (okul adı/il/ilçe hâlâ istemciden
-- değiştirilemez).
drop policy if exists "schools_update_own_school" on public.schools;
create policy "schools_update_own_school" on public.schools
  for update using (id = public.current_school_id())
  with check (id = public.current_school_id());

grant update (rotation_mode) on public.schools to authenticated;
