import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { fieldControlClasses } from './styles'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
}

/** Select nativo: en el móvil abre el selector del sistema, que es el más cómodo. */
export function SelectField({ label, hint, className, children, ...props }: SelectFieldProps) {
  const id = useId()
  return (
    <Field id={id} label={label} hint={hint}>
      <div className="relative">
        <select
          id={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(fieldControlClasses, 'min-h-11 appearance-none pr-10', className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted" />
      </div>
    </Field>
  )
}
