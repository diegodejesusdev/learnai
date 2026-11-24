import { TargetSearch, type TargetSearchProps } from './TargetSearch'

/** Elegir tema o proyecto en un formulario: el elegido arriba y el buscador debajo. */
export function TargetPicker(props: TargetSearchProps) {
  const { selected } = props
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 border-t-2 border-fg pt-5">
        <p className="text-sm font-medium text-accent">
          {selected?.context ?? 'Elige qué vas a estudiar'}
        </p>
        <p className="text-lead text-balance wrap-break-word hyphens-auto">
          {selected?.title ?? '—'}
        </p>
      </div>
      <TargetSearch {...props} />
    </div>
  )
}
