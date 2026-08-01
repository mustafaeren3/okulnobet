import { UserPlus, MapPinned, Wand2, Share2 } from 'lucide-react';

const STEPS = [
  { icon: UserPlus, title: 'Öğretmenleri Ekle', desc: 'Personel listeni ve branşlarını gir — elle veya teşkilat şemasından otomatik.' },
  { icon: MapPinned, title: 'Nöbet Bölgelerini Tanımla', desc: 'Kaç bölge, kaç kişi gerektiği ve önceliklerini belirle.' },
  { icon: Wand2, title: 'Tek Tıkla Program Oluştur', desc: 'Motor, kurallara uygun ve adil bir rotasyonla programı saniyeler içinde üretir.' },
  { icon: Share2, title: 'Yazdır veya Paylaş', desc: 'PDF/Word çıktısı al, ya da öğretmenlerinle bağlantı üzerinden paylaş.' },
];

export default function ProcessSteps() {
  return (
    <div className="process-steps">
      {STEPS.map((s, i) => (
        <div key={s.title} className="process-step">
          <div className="process-step-num">
            <s.icon size={20} />
            <span>{String(i + 1).padStart(2, '0')}</span>
          </div>
          <h4>{s.title}</h4>
          <p>{s.desc}</p>
          {i < STEPS.length - 1 && <span className="process-step-connector" aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}
