import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { getAllSiteContent } from '@/lib/db/cms';
import ContentEditor from './ContentEditor';

// Server Component — mevcut içerik BURADA çekiliyor, ContentEditor'a
// hazır veri olarak geçiyor. Kaydetme mutasyonları client tarafında
// (bkz. ContentEditor.jsx -> app/super-admin/actions/cms.js).
export default async function ContentPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);
  const content = await getAllSiteContent(supabase);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">İçerik Yönetimi</h1>
        <p className="text-sm text-muted-foreground">Landing page, yasal metinler ve genel ayarları kod yazmadan buradan düzenle. Kaydettiğinde site anında güncellenir.</p>
      </div>
      <ContentEditor initialContent={content} />
    </div>
  );
}
