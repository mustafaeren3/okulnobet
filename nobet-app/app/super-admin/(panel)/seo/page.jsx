import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { listSeoMeta } from '@/lib/db/cms';
import { Card, CardContent } from '../../ui/card';
import SeoEditor from './SeoEditor';

export default async function SeoPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);
  const rows = await listSeoMeta(supabase);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">SEO Yönetimi</h1>
        <p className="text-sm text-muted-foreground">Her sayfa için meta title/description, Open Graph, Twitter Card ve Schema.org (JSON-LD) — kod değiştirmeden. Search Console/Analytics ID'leri İçerik Yönetimi → Genel Ayarlar'da.</p>
      </div>
      <Card><CardContent className="p-0"><SeoEditor initialRows={rows} /></CardContent></Card>
    </div>
  );
}
