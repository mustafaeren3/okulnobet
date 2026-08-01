// Küçük durum/etiket rozeti. variant: success | warning | danger | neutral | primary
export default function Badge({ variant = 'neutral', children, className = '', ...rest }) {
  return (
    <span className={['badge-pill', `badge-${variant}`, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}
