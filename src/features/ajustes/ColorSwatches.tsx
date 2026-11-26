const groups = [
  {
    title: 'Fondo y texto',
    swatches: [
      { name: 'bg', className: 'bg-bg' },
      { name: 'surface', className: 'bg-surface' },
      { name: 'surface-muted', className: 'bg-surface-muted' },
      { name: 'border', className: 'bg-border' },
      { name: 'control', className: 'bg-control' },
      { name: 'fg-muted', className: 'bg-fg-muted' },
      { name: 'fg', className: 'bg-fg' },
    ],
  },
  {
    title: 'Negro: lo que se toca y el marco',
    swatches: [
      { name: 'action', className: 'bg-action' },
      { name: 'chrome', className: 'bg-chrome' },
      { name: 'done', className: 'bg-done' },
    ],
  },
  {
    title: 'Vinotinto: lo de ahora y tu avance',
    swatches: [
      { name: 'hero', className: 'bg-hero' },
      { name: 'meter', className: 'bg-meter' },
      { name: 'track', className: 'bg-track' },
      { name: 'accent', className: 'bg-accent' },
      { name: 'accent-soft', className: 'bg-accent-soft' },
      { name: 'progress', className: 'bg-progress' },
    ],
  },
  {
    title: 'Error: solo con ícono y texto',
    swatches: [{ name: 'danger', className: 'bg-danger' }],
  },
  {
    title: 'Código y diagramas de las lecciones',
    swatches: [
      { name: 'code-keyword', className: 'bg-code-keyword' },
      { name: 'code-string', className: 'bg-code-string' },
      { name: 'code-value', className: 'bg-code-value' },
      { name: 'code-comment', className: 'bg-code-comment' },
      { name: 'diagram', className: 'bg-diagram' },
    ],
  },
  {
    title: 'Mapa de calor',
    swatches: [
      { name: 'heat-0', className: 'bg-heat-0' },
      { name: 'heat-1', className: 'bg-heat-1' },
      { name: 'heat-2', className: 'bg-heat-2' },
      { name: 'heat-3', className: 'bg-heat-3' },
      { name: 'heat-4', className: 'bg-heat-4' },
    ],
  },
] as const

export function ColorSwatches() {
  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ title, swatches }) => (
        <div key={title} className="flex flex-col gap-3">
          <h3 className="font-bold">{title}</h3>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {swatches.map(({ name, className }) => (
              <li key={name} className="flex flex-col gap-1.5">
                <span className={`h-16 rounded-control border border-border ${className}`} />
                <code className="text-xs text-fg-muted">{name}</code>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
