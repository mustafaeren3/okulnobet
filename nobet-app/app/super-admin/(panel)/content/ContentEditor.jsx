'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../ui/card';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import ArrayFieldEditor from './ArrayFieldEditor';
import { SITE_CONTENT_DEFAULTS, SITE_CONTENT_LABELS, withDefaults } from '@/lib/data/siteContentDefaults';
import { saveSiteContent } from '../../actions/cms';

const TABS = ['hero', 'features', 'testimonials', 'faq', 'footer', 'contact', 'social', 'legal_privacy', 'legal_terms', 'legal_cookies', 'global_settings'];

function Field({ label, value, onChange, multiline, type }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {multiline ? (
        <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={multiline === true ? 3 : multiline} />
      ) : (
        <Input type={type || 'text'} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

// Her tab kendi verisini `data` prop'undan alır, `setField` ile taslağı
// günceller, "Kaydet" tıklanınca saveSiteContent(key, draft) çağrılır.
// Sekmeler arası state KAYBOLMAZ (tek üst component'te tutuluyor) —
// bir sekmede kaydetmeden diğerine geçip geri dönmek taslağı silmiyor.
export default function ContentEditor({ initialContent }) {
  const [drafts, setDrafts] = useState(() => {
    const d = {};
    for (const key of TABS) d[key] = withDefaults(key, initialContent[key]);
    return d;
  });
  const [busyKey, setBusyKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);
  const [errorKey, setErrorKey] = useState(null);

  function setField(tabKey, field, value) {
    setDrafts((d) => ({ ...d, [tabKey]: { ...d[tabKey], [field]: value } }));
    setSavedKey(null);
  }

  async function handleSave(tabKey) {
    setBusyKey(tabKey);
    setErrorKey(null);
    const res = await saveSiteContent(tabKey, drafts[tabKey]);
    setBusyKey(null);
    if (res.error) { setErrorKey({ key: tabKey, message: res.error }); return; }
    setSavedKey(tabKey);
    setTimeout(() => setSavedKey(null), 2500);
  }

  function SaveBar({ tabKey }) {
    return (
      <CardFooter className="flex items-center gap-3">
        <Button onClick={() => handleSave(tabKey)} disabled={busyKey === tabKey}>
          <Save size={14} /> {busyKey === tabKey ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
        {savedKey === tabKey && <span className="text-sm text-emerald-600">Kaydedildi ✓ (site anında güncellendi)</span>}
        {errorKey?.key === tabKey && <span className="text-sm text-destructive">{errorKey.message}</span>}
      </CardFooter>
    );
  }

  const hero = drafts.hero, footer = drafts.footer, contact = drafts.contact, social = drafts.social, settings = drafts.global_settings;

  return (
    <Tabs defaultValue="hero" className="flex flex-col gap-4">
      <TabsList className="flex-wrap h-auto">
        {TABS.map((t) => <TabsTrigger key={t} value={t}>{SITE_CONTENT_LABELS[t]}</TabsTrigger>)}
      </TabsList>

      <TabsContent value="hero">
        <Card>
          <CardHeader><CardTitle>Hero (Ana Başlık)</CardTitle><CardDescription>Anasayfanın en üstündeki başlık alanı.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field label="Başlık" value={hero.title} onChange={(v) => setField('hero', 'title', v)} multiline={2} />
            <Field label="Alt Başlık" value={hero.subtitle} onChange={(v) => setField('hero', 'subtitle', v)} multiline={2} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ana Buton Metni" value={hero.ctaPrimaryLabel} onChange={(v) => setField('hero', 'ctaPrimaryLabel', v)} />
              <Field label="Ana Buton Linki" value={hero.ctaPrimaryHref} onChange={(v) => setField('hero', 'ctaPrimaryHref', v)} />
              <Field label="İkincil Buton Metni" value={hero.ctaSecondaryLabel} onChange={(v) => setField('hero', 'ctaSecondaryLabel', v)} />
              <Field label="İkincil Buton Linki" value={hero.ctaSecondaryHref} onChange={(v) => setField('hero', 'ctaSecondaryHref', v)} />
            </div>
          </CardContent>
          <SaveBar tabKey="hero" />
        </Card>
      </TabsContent>

      <TabsContent value="features">
        <Card>
          <CardHeader><CardTitle>Özellik Kartları</CardTitle><CardDescription>Anasayfadaki "Neden OkulNöbet" bölümü. İkon adı lucide-react ikon ismidir (ör. Repeat2, Scale, Flag, Printer).</CardDescription></CardHeader>
          <CardContent>
            <ArrayFieldEditor
              items={drafts.features.items}
              onChange={(items) => setField('features', 'items', items)}
              fields={[{ key: 'icon', label: 'İkon adı (lucide-react)' }, { key: 'title', label: 'Başlık' }, { key: 'description', label: 'Açıklama', multiline: true }]}
              addLabel="Özellik Ekle"
              emptyItem={{ icon: 'Sparkles', title: '', description: '' }}
            />
          </CardContent>
          <SaveBar tabKey="features" />
        </Card>
      </TabsContent>

      <TabsContent value="testimonials">
        <Card>
          <CardHeader><CardTitle>Referanslar</CardTitle><CardDescription>Anasayfadaki müşteri/kullanıcı yorumları.</CardDescription></CardHeader>
          <CardContent>
            <ArrayFieldEditor
              items={drafts.testimonials.items}
              onChange={(items) => setField('testimonials', 'items', items)}
              fields={[{ key: 'quote', label: 'Yorum', multiline: true }, { key: 'role', label: 'Unvan/Rol' }]}
              addLabel="Referans Ekle"
              emptyItem={{ quote: '', role: '' }}
            />
          </CardContent>
          <SaveBar tabKey="testimonials" />
        </Card>
      </TabsContent>

      <TabsContent value="faq">
        <Card>
          <CardHeader><CardTitle>Sık Sorulan Sorular</CardTitle><CardDescription>Anasayfa ve /sss sayfasında gösterilir.</CardDescription></CardHeader>
          <CardContent>
            <ArrayFieldEditor
              items={drafts.faq.items}
              onChange={(items) => setField('faq', 'items', items)}
              fields={[{ key: 'q', label: 'Soru' }, { key: 'a', label: 'Cevap', multiline: true }]}
              addLabel="Soru Ekle"
              emptyItem={{ q: '', a: '' }}
            />
          </CardContent>
          <SaveBar tabKey="faq" />
        </Card>
      </TabsContent>

      <TabsContent value="footer">
        <Card>
          <CardHeader><CardTitle>Footer</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field label="Açıklama" value={footer.description} onChange={(v) => setField('footer', 'description', v)} multiline={2} />
            <Field label="Copyright adı" value={footer.copyrightName} onChange={(v) => setField('footer', 'copyrightName', v)} />
          </CardContent>
          <SaveBar tabKey="footer" />
        </Card>
      </TabsContent>

      <TabsContent value="contact">
        <Card>
          <CardHeader><CardTitle>İletişim Bilgileri</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field label="İletişim E-postası" value={contact.email} onChange={(v) => setField('contact', 'email', v)} />
            <Field label="Destek E-postası" value={contact.supportEmail} onChange={(v) => setField('contact', 'supportEmail', v)} />
            <Field label="Telefon" value={contact.phone} onChange={(v) => setField('contact', 'phone', v)} />
          </CardContent>
          <SaveBar tabKey="contact" />
        </Card>
      </TabsContent>

      <TabsContent value="social">
        <Card>
          <CardHeader><CardTitle>Sosyal Medya</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field label="Instagram URL" value={social.instagramUrl} onChange={(v) => setField('social', 'instagramUrl', v)} />
            <Field label="Instagram Kullanıcı Adı" value={social.instagramHandle} onChange={(v) => setField('social', 'instagramHandle', v)} />
          </CardContent>
          <SaveBar tabKey="social" />
        </Card>
      </TabsContent>

      {['legal_privacy', 'legal_terms', 'legal_cookies'].map((key) => (
        <TabsContent key={key} value={key}>
          <Card>
            <CardHeader>
              <CardTitle>{SITE_CONTENT_LABELS[key]}</CardTitle>
              <CardDescription>HTML olarak yazılabilir (ör. &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;&lt;li&gt;). Boş bırakılırsa sitedeki mevcut varsayılan metin gösterilir.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea value={drafts[key].bodyHtml || ''} onChange={(e) => setField(key, 'bodyHtml', e.target.value)} rows={16} className="font-mono text-xs" />
            </CardContent>
            <SaveBar tabKey={key} />
          </Card>
        </TabsContent>
      ))}

      <TabsContent value="global_settings">
        <Card>
          <CardHeader><CardTitle>Genel Ayarlar</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Site Adı" value={settings.siteName} onChange={(v) => setField('global_settings', 'siteName', v)} />
            <Field label="Domain" value={settings.domain} onChange={(v) => setField('global_settings', 'domain', v)} />
            <Field label="Site Açıklaması" value={settings.siteDescription} onChange={(v) => setField('global_settings', 'siteDescription', v)} multiline={2} />
            <Field label="Destek E-postası" value={settings.supportEmail} onChange={(v) => setField('global_settings', 'supportEmail', v)} />
            <Field label="Telefon" value={settings.phone} onChange={(v) => setField('global_settings', 'phone', v)} />
            <Field label="Logo URL" value={settings.logoUrl} onChange={(v) => setField('global_settings', 'logoUrl', v)} />
            <Field label="Favicon URL" value={settings.faviconUrl} onChange={(v) => setField('global_settings', 'faviconUrl', v)} />
            <Field label="Tema Rengi (hex)" value={settings.themeColor} onChange={(v) => setField('global_settings', 'themeColor', v)} />
            <Field label="SMTP Host" value={settings.smtpHost} onChange={(v) => setField('global_settings', 'smtpHost', v)} />
            <Field label="SMTP Port" value={settings.smtpPort} onChange={(v) => setField('global_settings', 'smtpPort', v)} />
            <Field label="SMTP Kullanıcı" value={settings.smtpUser} onChange={(v) => setField('global_settings', 'smtpUser', v)} />
            <Field label="SMTP Gönderen Adres" value={settings.smtpFrom} onChange={(v) => setField('global_settings', 'smtpFrom', v)} />
            <Field label="Google Analytics ID" value={settings.gaId} onChange={(v) => setField('global_settings', 'gaId', v)} />
            <Field label="Google Tag Manager ID" value={settings.gtmId} onChange={(v) => setField('global_settings', 'gtmId', v)} />
            <Field label="Search Console Doğrulama Kodu" value={settings.gscVerification} onChange={(v) => setField('global_settings', 'gscVerification', v)} />
            <Field label="Microsoft Clarity ID" value={settings.clarityId} onChange={(v) => setField('global_settings', 'clarityId', v)} />
            <Field label="Meta Pixel ID" value={settings.metaPixelId} onChange={(v) => setField('global_settings', 'metaPixelId', v)} />
          </CardContent>
          <SaveBar tabKey="global_settings" />
        </Card>
      </TabsContent>
    </Tabs>
  );
}
