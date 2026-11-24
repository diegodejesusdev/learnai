import { BookOpen, Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Hero } from '@/components/ui/Hero'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Section } from '@/components/ui/Section'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { TextField } from '@/components/ui/TextField'
import { SaveIndicator } from '@/components/ui/SaveIndicator'
import { toast } from '@/lib/toast'
import { ColorSwatches } from './ColorSwatches'

const sampleTabs = [
  { value: 'una', label: 'Primera ruta' },
  { value: 'otra', label: 'Segunda ruta' },
] as const

function TabsSample() {
  const [tab, setTab] = useState<(typeof sampleTabs)[number]['value']>('una')
  return (
    <Card className="flex flex-col gap-3">
      <Tabs
        label="Pestañas de ejemplo"
        options={sampleTabs}
        value={tab}
        onChange={setTab}
        panelId="pestana-ejemplo"
      />
      <p id="pestana-ejemplo" role="tabpanel" className="text-fg-muted">
        Contenido de «{sampleTabs.find((option) => option.value === tab)?.label}».
      </p>
      <SegmentedControl
        label="Selección de ejemplo"
        options={sampleTabs}
        value={tab}
        onChange={setTab}
      />
    </Card>
  )
}

/** Catálogo del sistema de diseño para revisarlo en claro y oscuro. */
export function DesignSystemPage() {
  return (
    <>
      <PageHeader title="Sistema de diseño" back={{ to: '/ajustes', label: 'Ajustes' }} />
      <div className="flex flex-col gap-12">
        <Section title="Colores">
          <ColorSwatches />
        </Section>

        <Section
          title="Tipografía"
          description="Inter con tamaño óptico: muy pesada en títulos, tabular en números."
        >
          <div className="flex flex-col gap-5">
            <p className="text-display">text-display</p>
            <p className="text-lead">text-lead</p>
            <p className="text-title">text-title</p>
            <p>Texto normal a 16 px para leer cómodo en el móvil.</p>
            <p className="text-sm text-fg-muted">
              Texto secundario a 15 px para descripciones y ayudas.
            </p>
            <p className="text-xs text-fg-muted">Lo más pequeño: 13 px.</p>
            <p className="text-figure">1 h 35 min</p>
            <p className="text-giant text-meter">42</p>
          </div>
        </Section>

        <Section
          title="Bloque de ahora"
          description="Uno por pantalla. Negro cuando algo está detenido."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Hero className="flex flex-col gap-6">
              <p className="text-lead">Seguir estudiando</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="inverse" size="lg">
                  Principal
                </Button>
                <Button variant="outline" size="lg">
                  Secundario
                </Button>
              </div>
            </Hero>
            <Hero tone="chrome" className="flex flex-col gap-2">
              <p className="text-lead">En pausa</p>
              <p className="text-hero-muted">El color dice el estado de lejos.</p>
            </Hero>
          </div>
        </Section>

        <Section title="Números">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Stat label="Hoy" value="25 min" hint="Hoy ya cuenta." />
            <Stat label="Racha" value="3 días" hint="Máxima: 5 días" />
          </div>
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
          <Card className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <StatusBadge status="pendiente" />
            <StatusBadge status="en_curso" />
            <StatusBadge status="hecho" />
            <Badge>Pomodoro</Badge>
            <Badge tone="accent">Fase 1</Badge>
          </Card>
        </Section>

        <Section
          title="Pestañas y selección"
          description="Las pestañas son para el PC; en el móvil, un menú desplegable."
        >
          <TabsSample />
        </Section>

        <Section title="Progreso">
          <Card className="flex flex-col gap-4">
            <ProgressBar value={0} label="Sin empezar" showLabel />
            <ProgressBar value={0.42} label="En camino" showLabel />
            <ProgressBar value={1} label="Completo" showLabel />
            <ProgressBar value={0.6} label="Pequeña" size="sm" />
          </Card>
        </Section>

        <Section title="Guardado y avisos">
          <Card className="flex flex-col gap-3">
            <SaveIndicator status="saving" />
            <SaveIndicator status="saved" />
            <SaveIndicator status="offline" />
            <SaveIndicator status="error" onRetry={() => toast.success('Reintentando…')} />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => toast.success('Cambios guardados.')}>
                Aviso de éxito
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.error('No se pudo guardar. Se restauró el anterior.')}
              >
                Aviso de error
              </Button>
            </div>
          </Card>
        </Section>

        <Section title="Formularios, vacíos y errores">
          <Card className="flex flex-col gap-4">
            <TextField
              label="Enlace al repositorio"
              type="url"
              placeholder="https://github.com/…"
              hint="Opcional"
            />
            <TextField
              label="Enlace a la demo"
              type="url"
              defaultValue="mi-demo.com"
              error="Escribe el enlace completo, empezando por https://"
            />
            <EmptyState
              icon={BookOpen}
              title="Aún no hay nada aquí"
              description="Así se ve un estado vacío."
            />
            <ErrorState
              title="No pudimos cargar esto"
              onRetry={() => toast.success('Reintentando…')}
            />
          </Card>
        </Section>
      </div>
    </>
  )
}
