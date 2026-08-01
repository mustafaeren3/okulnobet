import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { listMedia } from '@/lib/db/media';
import MediaLibrary from './MediaLibrary';

export default async function MediaPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);
  const items = await listMedia(supabase);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Medya Kütüphanesi</h1>
        <p className="text-sm text-muted-foreground">Logo, favicon, hero görseli ve diğer görselleri buradan yönet. Kopyaladığın URL'i İçerik Yönetimi'ndeki ilgili alana yapıştırabilirsin.</p>
      </div>
      <MediaLibrary initialItems={items} />
    </div>
  );
}
