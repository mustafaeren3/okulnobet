export const metadata = {
  title: 'Nöbet Sistemi',
  description: 'Okullar için otomatik nöbet programı sistemi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, background: '#0f1117', color: '#e8ecff', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
