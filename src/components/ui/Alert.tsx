import { CircleAlert, CircleCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface AlertProps {
  tone?: 'error' | 'success'
  children: ReactNode
}

export function Alert({ tone = 'error', children }: AlertProps) {
  const Icon = tone === 'error' ? CircleAlert : CircleCheck
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-xs border px-3 py-2.5 text-sm font-medium',
        tone === 'error' ? 'border-danger text-danger' : 'border-fg text-fg',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
