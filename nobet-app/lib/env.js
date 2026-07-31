// Ortam ayrımı için TEK karar noktası. Geliştirme kolaylıkları (MFA
// ekranını atlama, premium özellik kilitlerini açma) yalnızca buradan
// sorulur — kod içinde dağınık process.env kontrolü yapılmaz.
//
// Bilinçli karar: SADECE NODE_ENV === 'development' (yani `next dev`).
// "localhost" tespiti için Host başlığına BAKILMAZ — Host başlığı
// istemci kontrolündedir; yanlış yapılandırılmış bir proxy arkasında
// production'a "Host: localhost" göndererek güvenlik gevşetmesi
// tetiklenebilirdi. NODE_ENV ise build/çalıştırma zamanında sunucu
// tarafından belirlenir, istekle değiştirilemez. Production build'de
// (next build/start, Vercel vb.) NODE_ENV her zaman 'production'dır —
// bu dosyadaki hiçbir kolaylık orada devreye giremez.
//
// Vitest NODE_ENV='test' ile koşar — testler de bypass'sız, gerçek
// kuralları doğrulamaya devam eder.

export function isDevEnvironment() {
  return process.env.NODE_ENV === 'development';
}
