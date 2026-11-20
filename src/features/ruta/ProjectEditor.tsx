import {
  CircleCheck,
  CircleDashed,
  CircleDot,
  ExternalLink,
  FolderGit2,
  MessageCircle,
} from 'lucide-react'
import { useState } from 'react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { SaveIndicator } from '@/components/ui/SaveIndicator'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { TextField } from '@/components/ui/TextField'
import { statusLabels } from '@/lib/labels'
import { saveStatus } from '@/lib/saveStatus'
import { useDebouncedSave } from '@/lib/useDebouncedSave'
import type { Phase } from '@/types/curriculum'
import type { ProgressStatus } from '@/types/progress'
import type { ProjectPatch, ProjectProgress } from './progressApi'
import { normalizeUrl, urlError } from './projectForm'
import { useSaveProject } from './useProgress'

const statusOptions: readonly SegmentedOption<ProgressStatus>[] = [
  { value: 'pendiente', label: statusLabels.pendiente, icon: CircleDashed },
  { value: 'en_curso', label: statusLabels.en_curso, icon: CircleDot },
  { value: 'hecho', label: statusLabels.hecho, icon: CircleCheck },
]

interface ProjectEditorProps {
  phase: Phase
  project: ProjectProgress
}

export function ProjectEditor({ phase, project }: ProjectEditorProps) {
  const saveStatusChange = useSaveProject(
    'No se pudo cambiar el estado del proyecto. Se restauró el anterior.',
  )
  const saveText = useSaveProject(null)
  const [form, setForm] = useState({
    repo: project.repo_url ?? '',
    demo: project.demo_url ?? '',
    notes: project.notes,
  })
  const repoError = urlError(form.repo)
  const demoError = urlError(form.demo)

  const autosave = useDebouncedSave((patch: ProjectPatch) =>
    saveText.mutate({ phaseId: phase.id, patch }),
  )

  function update(field: keyof typeof form, value: string) {
    const next = { ...form, [field]: value }
    setForm(next)
    // Solo se guarda si los enlaces son válidos (la base también lo exige).
    if (urlError(next.repo) || urlError(next.demo)) return
    autosave.schedule({
      repo_url: normalizeUrl(next.repo),
      demo_url: normalizeUrl(next.demo),
      notes: next.notes,
    })
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="flex items-center gap-2 font-semibold">
          <FolderGit2 className="size-5 shrink-0 text-accent" />
          {phase.project.title}
        </h3>
        <p className="text-sm text-fg-muted">{phase.project.description}</p>
      </div>
      <SegmentedControl
        label="Estado del proyecto"
        options={statusOptions}
        value={project.status}
        onChange={(status) => saveStatusChange.mutate({ phaseId: phase.id, patch: { status } })}
      />
      <TextField
        label="Enlace al repositorio"
        type="url"
        inputMode="url"
        placeholder="https://github.com/…"
        value={form.repo}
        onChange={(event) => update('repo', event.target.value)}
        error={repoError}
      />
      <TextField
        label="Enlace a la demo"
        type="url"
        inputMode="url"
        placeholder="https://…"
        value={form.demo}
        onChange={(event) => update('demo', event.target.value)}
        error={demoError}
      />
      <TextAreaField
        label="Notas del proyecto"
        rows={4}
        placeholder="Qué hiciste, qué falta, qué aprendiste…"
        value={form.notes}
        onChange={(event) => update('notes', event.target.value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SaveIndicator
          status={saveStatus({ isWaiting: autosave.isWaiting, ...saveText })}
          onRetry={() => saveText.variables && saveText.mutate(saveText.variables)}
        />
        <div className="flex flex-wrap gap-2">
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-accent hover:underline"
            >
              Repositorio <ExternalLink className="size-3.5" />
            </a>
          )}
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-accent hover:underline"
            >
              Demo <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>
      <ButtonLink to={`/tutor?proyecto=${phase.id}`} variant="secondary" className="self-start">
        <MessageCircle className="size-4" />
        Revisar con el tutor
      </ButtonLink>
    </Card>
  )
}
