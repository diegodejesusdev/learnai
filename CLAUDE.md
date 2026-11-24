# LearnAI

App web personal para seguir varias rutas de estudio, definidas en `src/data/routes/` (un JSON por ruta):
- **Automatización para negocios** (`curriculum.json`): 9 fases, 100 temas, 9 proyectos y una checklist final de 14 ítems.
- **Ingeniería de datos** (`data-engineering.json`): 13 fases, 110 temas, 13 proyectos y una checklist final de 15 ítems. Sus ids empiezan por `de-`.

La usa una sola persona, en PC y en móvil. Toda la interfaz está en español.

Módulos:
- **Inicio**: minutos de hoy, racha, meta semanal, último tema, botón «Seguir estudiando» y progreso de cada ruta.
- **Ruta**: elegir ruta; fases, temas, estados, notas, proyecto por fase, checklist final y progreso de cada una.
- **Temporizador**: sesiones ligadas a un tema o a un proyecto, en modo Pomodoro o libre, y registro manual.
- **Historial**: mapa de calor, rachas, horas por semana, por ruta y por fase, filtro por ruta, lista editable y exportación CSV.
- **Tutor IA**: chat que conoce las rutas y el progreso, y se adapta a la ruta del tema. Modos: explicar, quiz, revisar proyecto y qué estudiar hoy.

Especificación completa: `docs/SPEC.md`. Plan por fases: `docs/PLAN.md`. Configuración fuera del código (Supabase en la nube, Google, Vercel): `docs/SETUP.md`.

## Stack

- React 19 + Vite 8 + TypeScript 6.0 estricto. No se usa TS 7 porque typescript-eslint todavía no lo soporta.
- Tailwind CSS v4 (plugin `@tailwindcss/vite`, tokens en CSS con `@theme`)
- React Router 8 (modo data: `createBrowserRouter`), TanStack Query
- Iconos: `lucide-react`. Fuente: Inter (`@fontsource-variable/inter`, autoalojada)
- Calidad: ESLint 10 (con typescript-eslint con tipos), Prettier (ordena las clases de Tailwind) y Vitest + Testing Library
- vite-plugin-pwa
- Supabase: Postgres con RLS, Auth (enlace mágico por correo con código de respaldo, y Google) y Edge Functions (Deno). Cliente `@supabase/supabase-js` con tipos generados.
- Tutor: Edge Function `tutor` con proveedor según `TUTOR_PROVIDER` (`gemini` por defecto, `anthropic` como alternativa, `demo` para probar en local) y `TUTOR_MODEL`. Auth con `@supabase/server`; SDK oficiales `@google/genai` y `@anthropic-ai/sdk`. Markdown con `react-markdown` + `remark-gfm`
- Fechas: `date-fns` + `@date-fns/tz`
- Gráficas: Recharts 3, cargado con `lazy` solo en el Historial
- Pruebas: Vitest (lógica pura) y pgTAP (`supabase test db`, para RLS)
- Despliegue: Vercel, conectado al repo de GitHub desde su panel
- Entornos: Supabase local en Docker para desarrollar y proyecto Supabase en la nube para producción

## Estructura de carpetas

```
LearnAI/
├── CLAUDE.md
├── docs/                      # SPEC.md, PLAN.md
├── public/                    # favicon.svg (luego iconos de la PWA)
├── scripts/                   # seed-curriculum.ts (npm run seed) + routeFiles.ts, curriculumRows.ts y seedRoutes.ts
│                              #   (lógica con test), test-tracks-migration.ts (npm run db:test:migracion)
├── src/
│   ├── main.tsx               # Monta providers + router
│   ├── app/                   # routes.tsx, Providers (caché persistida), ThemeProvider, 404, error,
│   │                          #   UpdatePrompt (versión nueva), offlineMutations.ts (cola sin conexión)
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
│   │   ├── routes/            # Fuente de verdad del contenido: un JSON por ruta (se edita aquí)
│   │   ├── curriculum.ts      # Las rutas para los tests: tracks, automationTrack, dataTrack, phases
│   ├── lib/                   # supabase.ts, env.ts, dates.ts, progress.ts, roadmap.ts (Track y rutas), theme.ts…
│   ├── types/                 # database.ts (generado, no editar), curriculum.ts, progress.ts
│   ├── styles/index.css       # Tailwind + tokens de color claro/oscuro
│   └── test/setup.ts          # jest-dom + limpieza entre tests
├── supabase/
│   ├── config.toml            # Config de Supabase local (URLs de redirección, plantillas, Google)
│   ├── functions/
│   │   ├── _shared/           # Código puro de la función y la app (alias @shared): tipos, contexto,
│   │   │                      #   prompts, quiz, errores, NDJSON. Sin Deno ni navegador; tests con Vitest
│   │   ├── tutor/             # Edge Function: index.ts, data.ts, respond.ts, proveedores; deno.json
│   │   ├── deno-env.d.ts      # Tipos de Deno.env solo para tsc
│   │   └── .env               # Secretos locales del tutor (no se sube; ver .env.example)
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
- **Sin conexión (cola):**
  - Una mutación que deba funcionar sin internet lleva una `mutationKey` propia y `scope: syncScope` (`lib/offline.ts`), y se registra en `src/app/offlineMutations.ts` con `setMutationDefaults`. Así se reanuda aunque se cierre la app.
  - Sus variables deben ser JSON plano.
  - Si inserta filas, lleva un id del dispositivo (`newId()` de `lib/uuid.ts`) y la función SQL ignora un id repetido.
  - Lo que exige conexión (editar o borrar sesiones, exportar) usa `networkMode: 'always'`, para fallar enseguida en vez de quedar esperando.
- **Operaciones de varios pasos en la base** (p. ej. guardar una sesión, borrar el temporizador y actualizar el tema): una función SQL `security invoker` en una migración, con sus pruebas pgTAP, que se llama con `supabase.rpc(...)`. Ver `finish_active_timer`.
- **Rutas (`Track`):**
  - `useRoadmap` trae todas (`Roadmap { tracks }`), con sus fases y su checklist. El progreso va por id de tema, fase o ítem, sin ruta: los ids no se repiten entre rutas.
  - `RoadmapGate` entrega `activeTrack`: la última ruta vista en la página Ruta, guardada en `user_settings.active_track_id` (vacía = la primera).
  - Los enlaces a una ruta usan `/ruta?ruta=<id>`. Verla la deja como activa (`useShownTrack`).
  - «Fase 1» existe en varias rutas: fuera de la página de una ruta se usa `trackPhaseLabel`.
  - La racha, la meta semanal, el mapa y las semanas cuentan todas las rutas juntas.
- **Caché del dispositivo:** si cambia la forma de los datos de una consulta, cambia su clave (como `roadmapKey`). `CACHE_VERSION` no se toca: borraría también los cambios en cola que aún no se han subido (`src/app/upgradeFromV1.test.ts`).
- **Temporizador:** el tiempo se calcula siempre desde la hora de inicio guardada (`timerModel.ts`). Nunca se cuentan segundos en memoria; `useNow` solo sirve para repintar.
- **Sesiones y totales:**
  - Los totales (por día, semana y fase) los calculan las funciones SQL `study_*_totals`, en hora de Bogotá. No se suman sesiones en el navegador; solo el CSV las descarga todas.
  - Las rachas y el mapa se calculan sobre esos totales con funciones puras (`lib/studyStats.ts`, `historial/heatmapModel.ts`).
  - Las claves de consulta que dependen de `study_sessions` están en `lib/sessionQueries.ts`. Tras guardar, editar o borrar una sesión, llama a `invalidateSessionQueries(queryClient)`.
- **Edge Functions:**
  - Las dependencias npm se fijan con versión exacta en el `deno.json` de la función y, con la misma versión, en `devDependencies`, para que `npm run typecheck` (`tsconfig.functions.json`) revise los tipos.
  - Lo que se pueda probar sin red va en `_shared/` como función pura.
  - Las importaciones entre archivos de funciones llevan extensión `.ts` (Deno la exige).
  - Las consultas usan el cliente del usuario (`ctx.supabase`), nunca el admin.
- **Gráficas:**
  - Recharts se importa con `lazy`, para que no entre en el arranque.
  - Los colores van con tokens (`fill="var(--accent)"`; los ejes, `var(--fg-muted)`).
  - Cada gráfica lleva una tabla «Ver los datos» (`ChartDataTable`).
  - El mapa de calor usa los tokens `heat-0` … `heat-4`.
- **Tests de integración de UI:** usa `renderApp(ruta)` de `src/test/renderApp.tsx` y simula los `*Api.ts` con `vi.mock`. `src/test/setup.ts` ya simula `timerApi`, `settingsApi`, `historyApi` y `sessionsApi` (sin temporizador, con los ajustes por defecto y sin sesiones); cámbialos por test con `vi.mocked(...)`. `vi.clearAllMocks()` no deshace `mockResolvedValue`: vuelve a los valores por defecto en `beforeEach`.
- Imports con el alias `@/` → `src/` (por ejemplo `@/components/ui/Button`).
- **Secciones nuevas:**
  - Se agregan en `src/app/routes.tsx` con `lazy` (se descargan al abrirlas).
  - Las librerías pesadas que no se usan en todas las páginas (Recharts, react-markdown) se cargan con `lazy` donde se usan.
  - Sin esto, el rendimiento móvil de Lighthouse baja de 90.

## Convenciones

- **TypeScript estricto**: `strict: true`, sin `any` ni `@ts-ignore`. Los tipos de la base salen de `src/types/database.ts` (`Tables<>`, `Enums<>`); se regeneran con `npm run db:types` tras cada migración.
- **Componentes pequeños**: una responsabilidad por componente, unas 150 líneas como máximo. La lógica de datos va en hooks y la lógica pura en funciones aparte.
- **Lógica pura con pruebas**: fechas, rachas, cálculo del Pomodoro, porcentajes de progreso y CSV se escriben como funciones puras con tests en Vitest.
- **Idioma**: todo texto visible para el usuario va en español (etiquetas, errores, estados vacíos, `aria-label`). Los identificadores de código van en inglés. Los valores de la base van en inglés, salvo el estado de progreso, que es el enum `progress_status`: `pendiente` / `en_curso` / `hecho` (decisión de Diego en la fase 2).
- **Fechas**: en la base siempre `timestamptz` (UTC). Para mostrar o agrupar por día y semana se usa `America/Bogota`, y **solo** a través de `src/lib/dates.ts`. No se usa `new Date().getDate()` ni equivalentes para agrupar. La semana va de lunes a domingo. Una sesión cuenta en el día en que empezó.
- **Nada de claves en el código**:
  - Las claves de IA (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`) solo van en `supabase/functions/.env` (local) y en los secretos de Supabase (nube).
  - En el navegador solo van `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (clave anon o publishable), que son públicas y quedan protegidas por RLS.
  - `SUPABASE_SERVICE_ROLE_KEY` (o secret key) se usa solo en `npm run seed`, desde `.env.local` (local) o `.env.cloud` (nube). Nunca lleva prefijo `VITE_` ni va a Vercel.
  - `.env*` está en `.gitignore`, salvo `.env.example`.
- **RLS siempre**: toda tabla con `user_id` tiene RLS activa con política `user_id = (select auth.uid())`. Las tablas de contenido son de solo lectura para `authenticated`.
- **Base de datos**:
  - Todo cambio de esquema va en una migración nueva (`npx supabase migration new <nombre>`), nunca a mano en el panel.
  - Cada migración incluye RLS, `GRANT`s explícitos y, si aplica, pruebas en `supabase/tests/database/`.
  - Supabase local tiene `auto_expose_new_tables = false` para que falte un `GRANT` se note en local y no en producción.
  - Los ids de las rutas (`f1-t5`, `de-f1-t4`, `c1`…) no se renombran: el progreso está ligado a ellos.
- **Mobile-first**: se diseña primero a 360 px de ancho. Áreas táctiles de al menos 44 px, safe areas (`env(safe-area-inset-*)`) y nada de scroll horizontal.
- **Tema**: claro/oscuro según el sistema, con interruptor manual en Ajustes.
  - Los colores son tokens semánticos definidos en `src/styles/index.css`: `bg-bg`, `bg-surface`, `text-fg`, `text-fg-muted`, `bg-accent`, `bg-done-soft`…
  - No se usan colores sueltos de Tailwind (`bg-teal-600`) ni variantes `dark:` en los componentes.
  - Un color nuevo se agrega como token en los dos temas.
- **Componentes de UI**: se reutilizan los de `src/components/ui` antes de crear uno nuevo. Todo componente nuevo del sistema se agrega también a `/ajustes/diseno`.
- **Contenido de las rutas**:
  - Se edita el JSON en `src/data/routes/` y se corre `npm run seed` (y `npm run seed:cloud` para producción). La app lo lee de Supabase.
  - **Agregar una ruta** = agregar un JSON con su bloque `track` (`id`, `title`, `order`) y correr el seed. El tutor usa un perfil genérico; para afinarlo, se agrega uno en `_shared/tutorTracks.ts`.
  - El seed hace upsert por id: se puede repetir sin duplicar. Antes de escribir revisa todas las rutas: un id repetido, o que en la base es de otra ruta, lo detiene. No borra ids que ya no estén en los JSON; los lista como aviso.
  - El test `src/data/curriculum.test.ts` falla si cambia algún id de automatización.
- **Git**: Claude hace commits solo cuando Diego lo pide, y no hace push sin permiso.

## Comandos

App (desde la fase 1):

```bash
npm run dev           # Servidor de desarrollo en http://localhost:5173
npm run dev:host      # Igual, pero accesible desde el móvil en la misma Wi-Fi
npm run build         # Typecheck + build de producción en dist/
npm run preview       # Sirve dist/ localmente (preview:host para el móvil)
npm run pwa:icons     # Regenera los íconos de la PWA desde public/favicon.svg
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
npm run db:test:migracion   # La migración de rutas sobre una copia con datos (no toca tu base)
npm run db:types      # Regenera src/types/database.ts desde la base local
npm run seed          # Carga las rutas de src/data/routes en Supabase local (.env.local)
npm run seed:cloud    # Carga las rutas en la nube (.env.cloud)
npm run seed:sesiones -- --correo <correo>   # 17 sesiones de prueba en local (--borrar las quita)

npx supabase migration new <nombre>
npx supabase status                   # URL y claves locales
npx supabase db push --remote         # Aplica migraciones a la nube (sin --remote apunta a local)
npx supabase functions serve tutor    # Tutor en local (lee supabase/functions/.env)
npx supabase functions deploy tutor   # Sube la función a la nube
npx supabase secrets set NOMBRE=valor # Secretos del tutor en la nube (docs/SETUP.md §5)
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
