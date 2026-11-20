import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { describedById } from './fieldA11y'
import { fieldControlClasses } from './styles'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string | null
}

export function TextField({ label, hint, error, className, ...props }: TextFieldProps) {
  const id = useId()
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-describedby={describedById(id, hint, error)}
        aria-invalid={error ? true : undefined}
        className={cn(fieldControlClasses, 'min-h-11', className)}
        {...props}
      />
    </Field>
  )
}
