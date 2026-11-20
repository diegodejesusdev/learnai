// CSV según RFC 4180: separador coma, comillas dobles solo cuando hacen falta y fin de línea CRLF.
// Empieza con BOM para que Excel lea las tildes como UTF-8 (Google Sheets y pandas lo ignoran).

export type CsvCell = string | number

function escapeCell(cell: CsvCell): string {
  const text = String(cell)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return '\uFEFF' + rows.map((row) => row.map(escapeCell).join(',') + '\r\n').join('')
}
