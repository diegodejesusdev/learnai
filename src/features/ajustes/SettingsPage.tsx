import { ArrowRight, Monitor, Moon, Sun } from 'lucide-react'
import { Link } from 'react-router'
import { useTheme } from '@/app/ThemeContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import type { ThemePreference } from '@/lib/theme'
import { AccountSection } from './AccountSection'
import { ExportDataSection } from './ExportDataSection'
import { InstallAppSection } from './InstallAppSection'
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
      <div className="flex flex-col gap-12">
        <Section
          split
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

        <InstallAppSection />

        <ExportDataSection />

        <AccountSection />

        <Section split title="Desarrollo">
          <Link
            to="/ajustes/diseno"
            className="group flex min-h-14 items-center justify-between gap-4 border-y border-border font-semibold transition-colors hover:text-accent"
          >
            Sistema de diseño
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Section>
      </div>
    </>
  )
}
