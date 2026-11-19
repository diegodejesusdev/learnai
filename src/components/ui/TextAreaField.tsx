import { useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { fieldControlClasses } from './styles'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
}

export function TextAreaField({ label, hint, className, rows = 5, ...props }: TextAreaFieldProps) {
  const id = useId()
  return (
    <Field id={id} label={label} hint={hint}>
      <textarea
        id={id}
        rows={rows}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(fieldControlClasses, 'resize-y py-2.5', className)}
        {...props}
      />
    </Field>
  )
}
