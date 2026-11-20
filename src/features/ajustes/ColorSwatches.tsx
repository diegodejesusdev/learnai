const swatches = [
  { name: 'bg', className: 'bg-bg' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'surface-muted', className: 'bg-surface-muted' },
  { name: 'border', className: 'bg-border' },
  { name: 'fg', className: 'bg-fg' },
  { name: 'fg-muted', className: 'bg-fg-muted' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'accent-soft', className: 'bg-accent-soft' },
  { name: 'pending', className: 'bg-pending' },
  { name: 'progress', className: 'bg-progress' },
  { name: 'done', className: 'bg-done' },
  { name: 'danger', className: 'bg-danger' },
  { name: 'heat-1', className: 'bg-heat-1' },
  { name: 'heat-2', className: 'bg-heat-2' },
  { name: 'heat-3', className: 'bg-heat-3' },
  { name: 'heat-4', className: 'bg-heat-4' },
] as const

export function ColorSwatches() {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {swatches.map(({ name, className }) => (
        <li key={name} className="flex flex-col gap-1.5">
          <span className={`h-12 rounded-xl border border-border ${className}`} />
          <code className="text-xs text-fg-muted">{name}</code>
        </li>
      ))}
    </ul>
  )
}
