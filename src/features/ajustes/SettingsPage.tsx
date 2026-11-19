import { ChevronRight, Monitor, Moon, Palette, Sun } from 'lucide-react'
import { useTheme } from '@/app/ThemeContext'
import { Card } from '@/components/ui/Card'
import { CardLink } from '@/components/ui/CardLink'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { TextField } from '@/components/ui/TextField'
import type { ThemePreference } from '@/lib/theme'
import { AccountSection } from './AccountSection'

const themeOptions: readonly SegmentedOption<ThemePreference>[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
]

export function SettingsPage() {
  const { preference, setPreference } = useTheme()

  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="flex flex-col gap-8">
        <Section
          title="Apariencia"
          description="«Sistema» sigue el modo claro u oscuro de tu dispositivo."
        >
          <SegmentedControl
            label="Tema"
            options={themeOptions}
            value={preference}
            onChange={setPreference}
          />
        </Section>

        <Section title="Estudio" description="Se guardarán en tu cuenta desde la fase 2.">
          <Card className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField
              label="Meta semanal (horas)"
              type="number"
              inputMode="numeric"
              defaultValue={10}
              disabled
            />
            <TextField
              label="Pomodoro: trabajo (min)"
              type="number"
              inputMode="numeric"
              defaultValue={25}
              disabled
            />
            <TextField
              label="Pomodoro: descanso (min)"
              type="number"
              inputMode="numeric"
              defaultValue={5}
              disabled
            />
          </Card>
        </Section>

        <AccountSection />

        <Section title="Desarrollo">
          <CardLink to="/ajustes/diseno" className="flex items-center gap-3">
            <Palette className="size-5 text-accent" />
            <span className="flex-1 font-medium">Sistema de diseño</span>
            <ChevronRight className="size-5 text-fg-muted" />
          </CardLink>
        </Section>
      </div>
    </>
  )
}
