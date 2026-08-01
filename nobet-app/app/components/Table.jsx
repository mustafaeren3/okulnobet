// İnce sarmalayıcı — tutarlı stil için `.data-table` sınıfı + yatay taşma
// koruması ekler. `<thead>`/`<tbody>` içeriği çağıran taraf render eder,
// hiçbir veri/mantık bu bileşende yaşamaz.
export default function Table({ children, className = '' }) {
  return (
    <div className="table-wrap">
      <table className={['data-table', className].filter(Boolean).join(' ')}>{children}</table>
    </div>
  );
}
