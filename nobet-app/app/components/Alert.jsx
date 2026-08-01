// Bilgi/uyarı/hata çağrı kutusu — Dashboard'daki .info-box'ların yerini alıyor.
// variant: info | warning | danger
export default function Alert({ variant = 'info', children, className = '', ...rest }) {
  return (
    <div className={['alert', `alert-${variant}`, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}
