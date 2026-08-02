import { defineConfig } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Next.js dev server .env.local'i kendi başlatma sürecinde otomatik okur,
// ama Playwright test runner (Node tarafında, tests/e2e/helpers.js'in
// @supabase/supabase-js ile doğrudan bağlanması için) BUNU otomatik
// yapmaz — yeni bir bağımlılık (dotenv) eklemeden minimal bir yükleyici.
const envPath = join(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30000,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
});
