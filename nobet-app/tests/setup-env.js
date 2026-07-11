import fs from 'node:fs';
import path from 'node:path';

// Next.js .env.local'ı otomatik yükler ama Vitest yüklemez; testler aynı
// yerel Supabase projesine bağlanabilsin diye burada elle okuyup
// process.env'e yazıyoruz. Prod ortamında bu dosya çalışmaz (dosya yoksa
// sessizce atlanır) — CI'da gerçek env değişkenleri zaten set edilmiş olmalı.
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });
}
