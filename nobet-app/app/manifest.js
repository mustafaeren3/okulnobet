export default function manifest() {
  return {
    name: 'OkulNöbet',
    short_name: 'OkulNöbet',
    description: 'Okullar için otomatik nöbet programı sistemi',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1220',
    theme_color: '#0b1220',
    icons: [{ src: '/brand/okulnobet-logo.png', sizes: '1254x1254', type: 'image/png' }],
  };
}
