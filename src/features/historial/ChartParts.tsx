interface ChartTooltipBoxProps {
  value: string
  label: string
}

/** Contenido del tooltip: el valor primero y en negrita; debajo, qué es. */
export function ChartTooltipBox({ value, label }: ChartTooltipBoxProps) {
  return (
    <div className="rounded-control bg-chrome px-3 py-2 text-sm text-chrome-fg ring-1 ring-border">
      <p className="text-lg font-extrabold tracking-tight tabular-nums">{value}</p>
      <p className="text-chrome-muted">{label}</p>
    </div>
  )
}

interface ChartDataTableProps {
  caption: string
  columns: readonly string[]
  rows: readonly (readonly string[])[]
}

/** Los mismos datos de la gráfica en una tabla, para leerlos sin pasar el dedo por las barras. */
export function ChartDataTable({ caption, columns, rows }: ChartDataTableProps) {
  return (
    <details className="text-sm">
      <summary className="flex min-h-11 w-fit cursor-pointer items-center font-semibold underline decoration-control underline-offset-4 hover:decoration-fg">
        Ver los datos
      </summary>
      <table className="w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-sm text-fg-muted">
          <tr>
            {columns.map((column, index) => (
              <th key={column} scope="col" className={index > 0 ? 'py-1 text-right' : 'py-1'}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => (
                <td key={index} className={index > 0 ? 'py-1.5 text-right tabular-nums' : 'py-1.5'}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
