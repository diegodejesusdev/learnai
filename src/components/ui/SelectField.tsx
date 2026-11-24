import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { describedById } from './fieldA11y'
import { fieldControlClasses } from './styles'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string | null
}

/** Select nativo: en el móvil abre el selector del sistema, que es el más cómodo. */
export function SelectField({
  label,
  hint,
  error,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const id = useId()
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          id={id}
          aria-describedby={describedById(id, hint, error)}
          aria-invalid={error ? true : undefined}
          className={cn(fieldControlClasses, 'min-h-12 appearance-none truncate pr-10', className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-fg" />
      </div>
    </Field>
  )
}
