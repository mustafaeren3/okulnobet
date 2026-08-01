#!/usr/bin/env node
// MEB il/ilçe/okul verisinde (lib/data/mebProvinces.json, lib/data/mebSchools.json)
// duplicate veya tutarsız kayıt kalmadığını doğrular. `npm run build`'a
// gömülü — herhangi bir gelecekteki commit bu dosyalara yeniden duplicate
// sokarsa build KIRILIR (bkz. package.json "build" scripti).
//
// Kontrol edilenler:
//   1) mebProvinces.json: aynı il içinde duplicate ilçe (tam + Türkçe
//      karakter/case duyarsız normalize edilmiş)
//   2) mebProvinces.json: duplicate il anahtarı
//   3) mebSchools.json: duplicate il anahtarı
//   4) mebSchools.json: bir ilin altında duplicate ilçe anahtarı
//      (normalize edilmiş) — aynı ilçenin iki ayrı yazımla iki kova
//      olarak var olması (asıl kök neden, bkz. PHASE geçmişi)
//   5) mebSchools.json: bir ilçe kovası içinde TAM duplicate okul
//      (aynı isim + aynı tür)
//   6) mebSchools.json: bir ilçe kovası içinde YAKIN duplicate okul
//      (normalize edilince aynı isim, farklı yazım/case)
//   7) mebProvinces.json ile mebSchools.json arasında il/ilçe seti
//      tutarlılığı (iki dosya birbirinden BAĞIMSIZ elle düzenlenebilir,
//      aralarında otomatik senkronizasyon YOK — bu kontrol drift'i yakalar)

const fs = require('fs');
const path = require('path');

const PROVINCES_PATH = path.join(__dirname, '..', 'lib', 'data', 'mebProvinces.json');
const SCHOOLS_PATH = path.join(__dirname, '..', 'lib', 'data', 'mebSchools.json');

function foldTurkish(s) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  return String(s || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (ch) => map[ch] || ch)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function findDuplicateKeys(keys) {
  const groups = new Map();
  keys.forEach((k) => {
    const n = foldTurkish(k);
    if (!groups.has(n)) groups.set(n, []);
    groups.get(n).push(k);
  });
  const dups = [];
  for (const arr of groups.values()) if (arr.length > 1) dups.push(arr);
  return dups;
}

function main() {
  const errors = [];
  let totalProvinces = 0;
  let totalDistrictsInProvincesFile = 0;
  let totalDistrictBucketsInSchoolsFile = 0;
  let totalSchools = 0;
  let dupProvinceCount = 0;
  let dupDistrictCount = 0;
  let dupSchoolCount = 0;

  const provincesData = JSON.parse(fs.readFileSync(PROVINCES_PATH, 'utf-8'));
  const schoolsData = JSON.parse(fs.readFileSync(SCHOOLS_PATH, 'utf-8'));

  // 1-2) mebProvinces.json
  totalProvinces = Object.keys(provincesData).length;
  const dupProvinceKeys1 = findDuplicateKeys(Object.keys(provincesData));
  if (dupProvinceKeys1.length) {
    dupProvinceCount += dupProvinceKeys1.length;
    dupProvinceKeys1.forEach((arr) => errors.push(`mebProvinces.json: duplicate il anahtarı ${JSON.stringify(arr)}`));
  }
  for (const [province, list] of Object.entries(provincesData)) {
    totalDistrictsInProvincesFile += list.length;
    const dups = findDuplicateKeys(list);
    if (dups.length) {
      dupDistrictCount += dups.length;
      dups.forEach((arr) => errors.push(`mebProvinces.json [${province}]: duplicate ilçe ${JSON.stringify(arr)}`));
    }
  }

  // 3) mebSchools.json il anahtarı
  const dupProvinceKeys2 = findDuplicateKeys(Object.keys(schoolsData));
  if (dupProvinceKeys2.length) {
    dupProvinceCount += dupProvinceKeys2.length;
    dupProvinceKeys2.forEach((arr) => errors.push(`mebSchools.json: duplicate il anahtarı ${JSON.stringify(arr)}`));
  }

  // 4-6) mebSchools.json ilçe anahtarları + okul kayıtları
  for (const [province, districts] of Object.entries(schoolsData)) {
    const districtKeys = Object.keys(districts);
    const dupDistrictKeys = findDuplicateKeys(districtKeys);
    if (dupDistrictKeys.length) {
      dupDistrictCount += dupDistrictKeys.length;
      dupDistrictKeys.forEach((arr) => errors.push(`mebSchools.json [${province}]: duplicate ilçe anahtarı ${JSON.stringify(arr)}`));
    }

    for (const [district, list] of Object.entries(districts)) {
      totalDistrictBucketsInSchoolsFile += 1;
      totalSchools += list.length;

      // 5) tam duplicate (isim + tür)
      const exactSeen = new Map();
      list.forEach((s) => {
        const k = `${s.name}|${s.type}`;
        if (!exactSeen.has(k)) exactSeen.set(k, 0);
        exactSeen.set(k, exactSeen.get(k) + 1);
      });
      for (const [k, count] of exactSeen) {
        if (count > 1) {
          dupSchoolCount += count - 1;
          errors.push(`mebSchools.json [${province}/${district}]: tam duplicate okul "${k}" x${count}`);
        }
      }

      // 6) yakın duplicate (normalize edilince aynı isim + tür, farklı yazım)
      const foldedSeen = new Map();
      list.forEach((s) => {
        const k = `${foldTurkish(s.name)}|${s.type}`;
        if (!foldedSeen.has(k)) foldedSeen.set(k, new Set());
        foldedSeen.get(k).add(s.name);
      });
      for (const [k, names] of foldedSeen) {
        if (names.size > 1) {
          dupSchoolCount += names.size - 1;
          errors.push(`mebSchools.json [${province}/${district}]: yakın duplicate okul ${JSON.stringify([...names])}`);
        }
      }
    }
  }

  // 7) iki dosya arasında il/ilçe seti tutarlılığı
  const provinceSet1 = new Set(Object.keys(provincesData));
  const provinceSet2 = new Set(Object.keys(schoolsData));
  for (const p of provinceSet1) if (!provinceSet2.has(p)) errors.push(`Tutarsızlık: "${p}" mebProvinces.json'da var, mebSchools.json'da yok.`);
  for (const p of provinceSet2) if (!provinceSet1.has(p)) errors.push(`Tutarsızlık: "${p}" mebSchools.json'da var, mebProvinces.json'da yok.`);
  for (const p of provinceSet1) {
    if (!provinceSet2.has(p)) continue;
    const districtSet1 = new Set(provincesData[p]);
    const districtSet2 = new Set(Object.keys(schoolsData[p]));
    for (const d of districtSet1) if (!districtSet2.has(d)) errors.push(`Tutarsızlık [${p}]: ilçe "${d}" mebProvinces.json'da var, mebSchools.json'da yok.`);
    for (const d of districtSet2) if (!districtSet1.has(d)) errors.push(`Tutarsızlık [${p}]: ilçe "${d}" mebSchools.json'da var, mebProvinces.json'da yok.`);
  }

  console.log('── MEB veri doğrulaması ──────────────────────────');
  console.log('Toplam il:', totalProvinces);
  console.log('Toplam ilçe (mebProvinces.json):', totalDistrictsInProvincesFile);
  console.log('Toplam ilçe kovası (mebSchools.json):', totalDistrictBucketsInSchoolsFile);
  console.log('Toplam okul:', totalSchools);
  console.log('Bulunan duplicate il:', dupProvinceCount);
  console.log('Bulunan duplicate ilçe:', dupDistrictCount);
  console.log('Bulunan duplicate okul:', dupSchoolCount);

  if (errors.length) {
    console.error('\n✗ DOĞRULAMA BAŞARISIZ — ' + errors.length + ' sorun bulundu:\n');
    errors.forEach((e) => console.error(' - ' + e));
    process.exit(1);
  }

  console.log('\n✓ Duplicate veya tutarsızlık bulunamadı.');
}

main();
