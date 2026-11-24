import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-block border-2 border-border px-5 py-8">
      <Icon className="size-8 text-meter" strokeWidth={1.75} />
      <p className="text-title text-balance">{title}</p>
      {description && <p className="max-w-md text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-3 w-full sm:w-auto">{action}</div>}
    </div>
  )
}
