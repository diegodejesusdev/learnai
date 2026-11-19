import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { fieldControlClasses } from './styles'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function TextField({ label, hint, className, ...props }: TextFieldProps) {
  const id = useId()
  return (
    <Field id={id} label={label} hint={hint}>
      <input
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(fieldControlClasses, 'min-h-11', className)}
        {...props}
      />
    </Field>
  )
}
