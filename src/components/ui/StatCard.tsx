import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  className?: string
}

export function StatCard({ label, value, hint, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <Icon className="size-4 text-accent" />
        {label}
      </div>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="text-xs text-fg-muted">{hint}</p>}
    </Card>
  )
}
