import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table';

// shadcn'in DataTable deseninde (kolon tanımı + satır dizisi) ama BİLEREK
// @tanstack/react-table'ın client-side hook'unu KULLANMIYOR — bu projede
// sıralama/filtreleme/sayfalama zaten sunucu tarafında (URL searchParams
// + RPC) yapılıyor, react-table'ın kendi state motorunu (ki 'use client'
// gerektirir) burada çalıştırmak sadece gereksiz JS indirtip hiçbir şey
// kazandırmazdı. Bu yüzden DataTable saf bir Server Component — kolonlar
// `{ key, header, cell(row) }` şeklinde, satırlar zaten sunucuda hazır.
export function DataTable({ columns, data, emptyMessage = 'Kayıt bulunamadı.' }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, i) => (
            <TableRow key={row.id ?? i}>
              {columns.map((col) => (
                <TableCell key={col.key}>{col.cell ? col.cell(row) : row[col.key]}</TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
