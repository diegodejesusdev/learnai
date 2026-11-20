# LearnAI

App web personal para seguir una ruta de estudio sobre automatización para pequeños negocios (9 fases, 100 temas, 9 proyectos y una checklist final de 14 ítems, definidos en `curriculum.json`). La usa una sola persona, en PC y en móvil. Toda la interfaz está en español.

Módulos:
- **Inicio**: minutos de hoy, racha, meta semanal, último tema y botón «Seguir estudiando».
- **Ruta**: fases, temas, estados, notas, proyecto por fase, checklist final y progreso.
- **Temporizador**: sesiones ligadas a un tema o a un proyecto, en modo Pomodoro o libre, y registro manual.
- **Historial**: mapa de calor, rachas, horas por semana y por fase, lista editable y exportación CSV.
- **Tutor IA**: chat que conoce la ruta y el progreso. Modos: explicar, quiz, revisar proyecto y qué estudiar hoy.

Especificación completa: `docs/SPEC.md`. Plan por fases: `docs/PLAN.md`. Configuración fuera del código (Supabase en la nube, Google, Vercel): `docs/SETUP.md`.

## Stack

- React 19 + Vite 8 + TypeScript 6.0 estricto. No se usa TS 7 porque typescript-eslint todavía no lo soporta.
- Tailwind CSS v4 (plugin `@tailwindcss/vite`, tokens en CSS con `@theme`)
- React Router 8 (modo data: `createBrowserRouter`), TanStack Query
- Iconos: `lucide-react`. Fuente: Inter (`@fontsource-variable/inter`, autoalojada)
- Calidad: ESLint 10 (con typescript-eslint con tipos), Prettier (ordena las clases de Tailwind) y Vitest + Testing Library
- vite-plugin-pwa
- Supabase: Postgres con RLS, Auth (enlace mágico por correo con código de respaldo, y Google) y Edge Functions (Deno). Cliente `@supabase/supabase-js` con tipos generados.
- Tutor: Edge Function `tutor` con proveedor según `AI_PROVIDER` (`gemini` por defecto, `anthropic` como alternativa)
- Fechas: `date-fns` + `@date-fns/tz`
- Pruebas: Vitest (lógica pura) y pgTAP (`supabase test db`, para RLS)
- Despliegue: Vercel, conectado al repo de GitHub desde su panel
- Entornos: Supabase local en Docker para desarrollar y proyecto Supabase en la nube para producción

## Estructura de carpetas

```
LearnAI/
├── curriculum.json            # Fuente de verdad del contenido de la ruta (se edita aquí)
├── CLAUDE.md
├── docs/                      # SPEC.md, PLAN.md
├── public/                    # favicon.svg (luego iconos de la PWA)
├── scripts/                   # seed-curriculum.ts (npm run seed) + curriculumRows.ts (lógica pura, con test)
├── src/
│   ├── main.tsx               # Monta providers + router
│   ├── app/                   # routes.tsx, Providers, ThemeProvider, 404, pantalla de error
│   ├── components/
│   │   ├── ui/                # Sistema de diseño: Button, Card, Badge, StatusBadge, ProgressBar,
│   │   │                      #   SegmentedControl, TextField, SelectField, PageHeader, Section…
│   │   └── layout/            # AppShell, BottomNav (móvil), Sidebar (≥1024 px), navItems
│   ├── features/              # Una carpeta por sección (nombres en español)
│   │   ├── inicio/
│   │   ├── ruta/
│   │   ├── temporizador/      # Sección «Estudiar»
│   │   ├── historial/
│   │   ├── tutor/
│   │   ├── ajustes/           # Incluye /ajustes/diseno (catálogo del sistema de diseño)
│   │   └── acceso/            # Login, AuthProvider/useAuth, RequireAuth, authApi, mensajes de error
│   ├── data/
│   │   ├── curriculum.json    # Copia de /curriculum.json (un test verifica que sean idénticas)
│   │   ├── curriculum.ts      # Acceso tipado: phases, allTopics, findPhase, findTopic
│   │   └── demo.ts            # Datos de ejemplo de la fase 1 (se borran al conectar Supabase)
│   ├── lib/                   # supabase.ts, env.ts, dates.ts, progress.ts, roadmap.ts, theme.ts…
│   ├── types/                 # database.ts (generado, no editar), curriculum.ts, progress.ts
│   ├── styles/index.css       # Tailwind + tokens de color claro/oscuro
│   └── test/setup.ts          # jest-dom + limpieza entre tests
├── supabase/
│   ├── config.toml            # Config de Supabase local (URLs de redirección, plantillas, Google)
│   ├── migrations/            # SQL versionado: esquema, RLS, triggers
│   ├── tests/database/        # Pruebas pgTAP (npm run db:test)
│   └── templates/             # Correo del enlace mágico (enlace + código)
├── .env.example
└── vercel.json                # Rewrites de SPA
```

- Las carpetas de `features/` van en español. Los archivos y los identificadores de código van en inglés (`RoadmapPage.tsx`, `phaseProgress`).
- Dentro de cada feature van sus componentes, sus hooks de datos (`use*.ts` con TanStack Query, desde la fase 2) y su lógica propia con su `*.test.ts` al lado.
- La lógica que usan varias features (fechas, progreso, tema) va en `src/lib/`.
- Acceso a datos por feature: `<algo>Api.ts` hace las llamadas a Supabase y lanza el error si lo hay, y `use<Algo>.ts` las envuelve con TanStack Query. Ejemplo: `features/ruta/roadmapApi.ts` + `useRoadmap.ts`. Los componentes no llaman a `supabase` directamente.
- **Mutaciones optimistas:** sigue el patrón de `features/ruta/useProgress.ts`:
  - `onMutate` aplica una función pura sobre la caché (como en `progressModel.ts`);
  - `onError` restaura el valor anterior y avisa con `toast.error(...)` de `lib/toast.ts`;
  - `onSettled` invalida.
  - Los textos con autoguardado usan `useDebouncedSave` + `SaveIndicator` y no revierten lo escrito.
- **Datos que cambian en otro dispositivo** (progreso, sesiones): `staleTime: 0`, para que se refresquen al volver a la app.
- **Tests de integración de UI:** usa `renderApp(ruta)` de `src/test/renderApp.tsx` y simula los `*Api.ts` con `vi.mock`.
- Imports con el alias `@/` → `src/` (por ejemplo `@/components/ui/Button`).

## Convenciones

- **TypeScript estricto**: `strict: true`, sin `any` ni `@ts-ignore`. Los tipos de la base salen de `src/types/database.ts` (`Tables<>`, `Enums<>`); se regeneran con `npm run db:types` tras cada migración.
- **Componentes pequeños**: una responsabilidad por componente, unas 150 líneas como máximo. La lógica de datos va en hooks y la lógica pura en funciones aparte.
- **Lógica pura con pruebas**: fechas, rachas, cálculo del Pomodoro, porcentajes de progreso y CSV se escriben como funciones puras con tests en Vitest.
- **Idioma**: todo texto visible para el usuario va en español (etiquetas, errores, estados vacíos, `aria-label`). Los identificadores de código van en inglés. Los valores de la base van en inglés, salvo el estado de progreso, que es el enum `progress_status`: `pendiente` / `en_curso` / `hecho` (decisión de Diego en la fase 2).
- **Fechas**: en la base siempre `timestamptz` (UTC). Para mostrar o agrupar por día y semana se usa `America/Bogota`, y **solo** a través de `src/lib/dates.ts`. No se usa `new Date().getDate()` ni equivalentes para agrupar. La semana va de lunes a domingo. Una sesión cuenta en el día en que empezó.
- **Nada de claves en el código**:
  - En el navegador solo van `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (clave anon o publishable), que son públicas y quedan protegidas por RLS.
  - `SUPABASE_SERVICE_ROLE_KEY` (o secret key) se usa solo en `npm run seed`, desde `.env.local` (local) o `.env.cloud` (nube). Nunca lleva prefijo `VITE_` ni va a Vercel.
  - Las claves de IA viven solo en los secrets de la Edge Function.
  - `.env*` está en `.gitignore`, salvo `.env.example`.
- **RLS siempre**: toda tabla con `user_id` tiene RLS activa con política `user_id = (select auth.uid())`. Las tablas de contenido son de solo lectura para `authenticated`.
- **Base de datos**:
  - Todo cambio de esquema va en una migración nueva (`npx supabase migration new <nombre>`), nunca a mano en el panel.
  - Cada migración incluye RLS, `GRANT`s explícitos y, si aplica, pruebas en `supabase/tests/database/`.
  - Supabase local tiene `auto_expose_new_tables = false` para que falte un `GRANT` se note en local y no en producción.
  - Los ids de `curriculum.json` no se renombran.
- **Mobile-first**: se diseña primero a 360 px de ancho. Áreas táctiles de al menos 44 px, safe areas (`env(safe-area-inset-*)`) y nada de scroll horizontal.
- **Tema**: claro/oscuro según el sistema, con interruptor manual en Ajustes.
  - Los colores son tokens semánticos definidos en `src/styles/index.css`: `bg-bg`, `bg-surface`, `text-fg`, `text-fg-muted`, `bg-accent`, `bg-done-soft`…
  - No se usan colores sueltos de Tailwind (`bg-teal-600`) ni variantes `dark:` en los componentes.
  - Un color nuevo se agrega como token en los dos temas.
- **Componentes de UI**: se reutilizan los de `src/components/ui` antes de crear uno nuevo. Todo componente nuevo del sistema se agrega también a `/ajustes/diseno`.
- **Contenido de la ruta**:
  - Se edita `/curriculum.json`, se copia a `src/data/curriculum.json` y se corre `npm run seed` (y `npm run seed:cloud` para producción).
  - El seed hace upsert por id: se puede repetir sin duplicar. No borra ids que ya no estén en el JSON; los lista como aviso.
  - El test `src/data/curriculum.test.ts` falla si las dos copias difieren.
  - Ruta ya lee el contenido de Supabase; las otras secciones siguen con el archivo hasta su fase.
- **Git**: Claude hace commits solo cuando Diego lo pide, y no hace push sin permiso.

## Comandos

App (desde la fase 1):

```bash
npm run dev           # Servidor de desarrollo en http://localhost:5173
npm run dev:host      # Igual, pero accesible desde el móvil en la misma Wi-Fi
npm run build         # Typecheck + build de producción en dist/
npm run preview       # Sirve dist/ localmente (preview:host para el móvil)
npm run typecheck     # tsc -b
npm run lint          # ESLint
npm run format        # Prettier (format:check solo verifica)
npm test              # Vitest una vez (test:watch para modo continuo)
```

Supabase (requiere Docker Desktop abierto):

```bash
npm run db:start      # Levanta Supabase local: API :54321, Studio http://127.0.0.1:54323,
                      #   correos de prueba (Mailpit) http://127.0.0.1:54324
npm run db:stop
npm run db:reset      # Recrea la base local con todas las migraciones (luego: npm run seed)
npm run db:test       # Pruebas pgTAP de RLS y restricciones
npm run db:types      # Regenera src/types/database.ts desde la base local
npm run seed          # Carga curriculum.json en Supabase local (.env.local)
npm run seed:cloud    # Carga curriculum.json en la nube (.env.cloud)

npx supabase migration new <nombre>
npx supabase status                   # URL y claves locales
npx supabase db push --remote         # Aplica migraciones a la nube (sin --remote apunta a local)
npx supabase functions serve tutor    # (fase 6)
npx supabase functions deploy tutor   # (fase 6)
npx supabase secrets set NOMBRE=valor # (fase 6)
```

Diego corre una sola vez `npx supabase login` y `npx supabase link --project-ref <ref>`.

## Al cerrar cada fase

Al terminar cada fase de `docs/PLAN.md`, Claude debe entregar:

1. **Qué se hizo** y qué quedó pendiente.
2. **Comandos que deben pasar**: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build` y, desde la fase 2, `npm run db:test`.
3. **Cómo probar en PC**: `npm run dev`, abrir http://localhost:5173, y pasos concretos para recorrer la funcionalidad de la fase, incluido el modo responsive de DevTools a 360 px.
4. **Cómo probar en el móvil**: `npm run dev:host`, abrir `http://<IP-del-PC>:5173` con el móvil en la misma Wi-Fi, y los pasos concretos de la fase.
   - En local, `VITE_SUPABASE_URL` debe apuntar a la IP del PC (`http://<IP>:54321`) y no a `127.0.0.1`.
   - En local, en el móvil se entra con el código del correo, que se lee en Mailpit desde el PC.
   - Desde la fase 7, se prueba con la URL HTTPS de Vercel e instalando la PWA.
5. **Casos límite** de la fase que conviene probar a mano.
