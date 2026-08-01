import * as Icons from 'lucide-react';

// site_content'te ikon, admin panelinde bir DÜZ METİN olarak tutuluyor
// (ör. "Repeat2") — jsonb bir React component saklayamaz. Bu, o ismi
// gerçek lucide-react component'ine çeviren TEK yer (CLAUDE.md: kod
// tekrarını azalt) — bilinmeyen/yanlış yazılmış bir isim verilirse
// sayfa çökmesin diye Sparkles'a düşer.
export default function DynamicLucideIcon({ name, ...props }) {
  const Icon = Icons[name] || Icons.Sparkles;
  return <Icon {...props} />;
}
