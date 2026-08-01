export default function EmptyState({ icon, title, subtitle, className = '' }) {
  return (
    <div className={['empty-state', className].filter(Boolean).join(' ')}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <div className="empty-state-title">{title}</div>}
      {subtitle && <div className="empty-state-subtitle">{subtitle}</div>}
    </div>
  );
}
