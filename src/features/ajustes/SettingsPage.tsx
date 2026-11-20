import { ChevronRight, Monitor, Moon, Palette, Sun } from 'lucide-react'
import { useTheme } from '@/app/ThemeContext'
import { CardLink } from '@/components/ui/CardLink'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import type { ThemePreference } from '@/lib/theme'
import { AccountSection } from './AccountSection'
import { StudySettingsSection } from './StudySettingsSection'
import { useSaveUserSettings } from './useUserSettings'

const themeOptions: readonly SegmentedOption<ThemePreference>[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
]

export function SettingsPage() {
  const { preference, setPreference } = useTheme()
  const saveSettings = useSaveUserSettings('No se pudo guardar el tema en tu cuenta.')

  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="flex flex-col gap-8">
        <Section
          title="Apariencia"
          description="«Sistema» sigue el modo claro u oscuro de tu dispositivo. Se guarda en tu cuenta."
        >
          <SegmentedControl
            label="Tema"
            options={themeOptions}
            value={preference}
            onChange={(theme) => {
              setPreference(theme)
              saveSettings.mutate({ theme })
            }}
          />
        </Section>

        <StudySettingsSection />

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
