import { useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { describedById } from './fieldA11y'
import { fieldControlClasses } from './styles'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  large?: boolean
  error?: string | null
}

export function TextAreaField({
  label,
  hint,
  large,
  error,
  className,
  rows = 5,
  ...props
}: TextAreaFieldProps) {
  const id = useId()
  return (
    <Field id={id} label={label} hint={hint} large={large} error={error}>
      <textarea
        id={id}
        rows={rows}
        aria-describedby={describedById(id, hint, error)}
        aria-invalid={error ? true : undefined}
        className={cn(fieldControlClasses, 'resize-y py-2.5', className)}
        {...props}
      />
    </Field>
  )
}
