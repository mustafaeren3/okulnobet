import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js', 'tests/db/**/*.test.js'],
    setupFiles: ['tests/setup-env.js'],
    // tests/db/* hepsi AYNI gerçek Supabase projesine karşı çalışıyor ve paylaşılan
    // bir IP bazlı auth rate limit'e tabi (sign_in_sign_ups) — dosyalar paralel
    // koşarsa limit aşılıp "Request rate limit reached" ile sahte-kırmızı testler
    // üretiyor. Seri koşum bunu ortadan kaldırıyor (kod hatası değildi).
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
