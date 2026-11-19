import { BookOpen, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Section } from '@/components/ui/Section'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TextField } from '@/components/ui/TextField'
import { ColorSwatches } from './ColorSwatches'

/** Catálogo del sistema de diseño para revisarlo en claro y oscuro. */
export function DesignSystemPage() {
  return (
    <>
      <PageHeader title="Sistema de diseño" back={{ to: '/ajustes', label: 'Ajustes' }} />
      <div className="flex flex-col gap-8">
        <Section title="Colores">
          <ColorSwatches />
        </Section>

        <Section title="Tipografía" description="Inter, con números tabulares para tiempos.">
          <Card className="flex flex-col gap-2">
            <p className="text-3xl font-semibold tracking-tight">Título de página</p>
            <p className="text-lg font-semibold tracking-tight">Título de sección</p>
            <p>Texto normal a 16 px para leer cómodo en el móvil.</p>
            <p className="text-sm text-fg-muted">Texto secundario para descripciones y ayudas.</p>
            <p className="text-4xl font-semibold tabular-nums">25:00</p>
          </Card>
        </Section>

        <Section title="Botones" description="Todos miden al menos 44 px de alto.">
          <Card className="flex flex-wrap gap-2">
            <Button>Principal</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="ghost">Discreto</Button>
            <Button variant="danger">Eliminar</Button>
            <Button size="icon" aria-label="Agregar">
              <Plus className="size-5" />
            </Button>
            <Button disabled>Deshabilitado</Button>
          </Card>
        </Section>

        <Section title="Estados y badges">
          <Card className="flex flex-wrap gap-2">
            <StatusBadge status="pendiente" />
            <StatusBadge status="en_curso" />
            <StatusBadge status="hecho" />
            <Badge>Pomodoro</Badge>
            <Badge tone="accent">Fase 1</Badge>
          </Card>
        </Section>

        <Section title="Progreso">
          <Card className="flex flex-col gap-4">
            <ProgressBar value={0} label="Sin empezar" showLabel />
            <ProgressBar value={0.42} label="En camino" showLabel />
            <ProgressBar value={1} label="Completo" showLabel />
            <ProgressBar value={0.6} label="Pequeña" size="sm" />
          </Card>
        </Section>

        <Section title="Formularios y vacíos">
          <Card className="flex flex-col gap-4">
            <TextField
              label="Enlace al repositorio"
              type="url"
              placeholder="https://github.com/…"
              hint="Opcional"
            />
            <EmptyState
              icon={BookOpen}
              title="Aún no hay nada aquí"
              description="Así se ve un estado vacío."
            />
          </Card>
        </Section>
      </div>
    </>
  )
}
