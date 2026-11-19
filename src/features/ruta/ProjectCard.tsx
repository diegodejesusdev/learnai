import { FolderGit2, MessageCircle } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Phase } from '@/types/curriculum'
import type { ProgressStatus } from '@/types/progress'

export function ProjectCard({ phase, status }: { phase: Phase; status: ProgressStatus }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FolderGit2 className="size-5 text-accent" />
        <h3 className="font-semibold">{phase.project.title}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="text-sm text-fg-muted">{phase.project.description}</p>
      <p className="text-xs text-fg-muted">
        Los enlaces a tu repositorio y demo, y las notas del proyecto, se editan desde la fase 3.
      </p>
      <ButtonLink to={`/tutor?proyecto=${phase.id}`} variant="secondary" className="self-start">
        <MessageCircle className="size-4" />
        Revisar con el tutor
      </ButtonLink>
    </Card>
  )
}
