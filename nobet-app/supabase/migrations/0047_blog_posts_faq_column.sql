-- Blog yazılarında FAQPage JSON-LD'yi /sss'teki gibi görünür içerikle
-- birebir aynı veriden üretebilmek için ayrı bir sütun — ham HTML
-- `content` içine gömülü bir <script> parse etmek yerine (kırılgan),
-- yapılandırılmış [{ q, a }, ...] burada tutulur. NULL = yazının FAQ
-- bölümü yok, sayfa FAQPage şeması render etmez.
alter table public.blog_posts add column if not exists faq jsonb;
