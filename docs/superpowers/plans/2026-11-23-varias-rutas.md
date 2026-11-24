# Varias rutas de estudio: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LearnAI con varias rutas de estudio, sin perder nada del progreso existente.

**Architecture:** Tabla `tracks` y `track_id` en el contenido; el progreso sigue ligado a los ids de siempre. La app carga todas las rutas en un solo `Roadmap { tracks }`, y la ruta activa vive en `user_settings`. El seed lee todos los JSON de `src/data/routes/`.

**Tech Stack:** el del repo (React 19, TanStack Query, Supabase, Vitest, pgTAP). Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-11-23-varias-rutas-design.md`

## Global Constraints

- Los ids actuales no cambian. La migración no modifica los datos de ninguna fila de usuario.
- `CACHE_VERSION` (`src/app/persistence.ts`) no cambia. `curriculum_meta` se conserva.
- Sin `any` ni `@ts-ignore`; componentes de unas 150 líneas como máximo; textos en español; identificadores en inglés; colores solo con tokens; áreas táctiles ≥ 44 px; 360 px sin scroll horizontal.
- Sin commits ni push: los pide Diego. Nada contra la nube sin su confirmación.
- No se corre `db:reset` sobre la base local (podría tener datos): se usa `supabase migration up`.
- Al cerrar cada tarea: `npm run typecheck && npm run lint && npm test`.

## Review Focus

1. Cola sin conexión guardada por la versión anterior (con la caché `['roadmap']` vieja al lado): debe reanudarse, sin leer la forma vieja. → Tarea 4
2. `active_track_id` ausente (caché vieja) o de una ruta que ya no existe: cae en la primera. → Tarea 3
3. Un tercer JSON mal formado, o que reutiliza un id de otra ruta: el seed aborta antes de escribir. → Tarea 2
4. Una sola ruta en la base (migrada y sin seed): la app funciona y no muestra selector. → Tarea 5
5. Una ruta sin fases (seed a medias): estado vacío, no «Completaste todos los temas». → Tarea 5

---

### Tarea 1: Migración, pgTAP y prueba sobre una copia

**Files:** Create `supabase/migrations/<ts>_tracks.sql`, `supabase/tests/database/tracks.test.sql`, `scripts/test-tracks-migration.ts`. Modify los pgTAP que insertan fases o checklist, `security.test.sql` (incluir `tracks`), `package.json`, `src/types/database.ts` (generado).

**Produces:** `tracks(id text pk, sort_order int, title text, goal text)`; `phases.track_id` y `checklist_items.track_id` (`not null`, fk `on update cascade on delete restrict`, índice `(track_id, sort_order)`); `user_settings.active_track_id text null` (fk `on delete set null`). `npm run db:test:migracion [-- --respaldo archivo.sql]`.

- [ ] pgTAP que falla: `tracks` existe con RLS; `authenticated` lee y no escribe; `phases` sin `track_id` → 23502; con ruta inexistente → 23503; borrar una ruta con fases → 23503 (restrict); borrar la ruta activa deja `active_track_id` nulo; un usuario nuevo tiene `active_track_id` nulo; B no ve ni cambia la ruta activa de A.
- [ ] Migración: crear `tracks` + RLS + grants; insertar `('automatizacion', 1, 'Automatización para negocios', <goal de curriculum.json>)`; columna nula → `update` → `set not null`; índices; `active_track_id`.
- [ ] `npx supabase migration up` (local), `npm run db:types`, `npm run db:test` → todo pasa.
- [ ] `scripts/test-tracks-migration.ts`: base temporal en el Postgres local; migraciones anteriores; contenido de automatización y datos de 2 usuarios en todas las tablas de usuario (o `--respaldo`); foto fila por fila; migración; nueva foto igual (sin las columnas nuevas); 9/100/14 en `automatizacion`; seed real (`seedRoutes`) dos veces con foto igual; borra la base siempre. Sale con código 1 si algo difiere. (El paso del seed se completa en la Tarea 2.)

### Tarea 2: Archivos de rutas y seed

**Files:** Move `curriculum.json` → `src/data/routes/curriculum.json` (con `track`), `src/data/data-engineering.json` → `src/data/routes/`. Delete `src/data/curriculum.json`, `src/features/temporizador/StudyTargetSelect.tsx` (sin uso). Create `scripts/routeFiles.ts`, `scripts/seedRoutes.ts` + tests. Modify `scripts/curriculumRows.ts`, `scripts/seed-curriculum.ts`, `src/types/curriculum.ts`, `src/data/curriculum.ts`, sus tests, `.prettierignore`, `scripts/seed-test-sessions.ts`.

**Produces:**
- `Curriculum.track: { id: string; title: string; order: number }`
- `toCurriculumRows(c: Curriculum): { track; phases; topics; checklist }`
- `parseCurriculum(raw: unknown, file: string): Curriculum` (lanza con mensaje en español), `loadRoutes(dir: string | URL): Promise<Curriculum[]>` (por `track.order`)
- `validateRoutes(routes: readonly Curriculum[]): string[]`
- `interface SeedStore { read(table): Promise<{id; track_id?; phase_id?}[]>; upsert(table, rows): Promise<void> }`, `seedRoutes(store, routes, log): Promise<void>`
- `src/data/curriculum.ts`: `tracks: readonly Track[]`, `phases` (automatización), `dataTrack`

- [ ] Tests: cada archivo de la carpeta es válido; automatización = 9/100/14 e ingeniería = 13/110/15; ids únicos entre rutas; los ids de automatización coinciden con la lista fija anterior (foto de los 123 ids); seed dos veces → mismo estado y solo toca `tracks, phases, topics, checklist_items`; id repetido entre rutas → error; id que en la base es de otra ruta → aborta sin escribir; JSON sin `track` → error con el nombre del archivo.
- [ ] Implementar; `npm run seed` dos veces en local: mismos conteos (2 / 22 / 210 / 29).

### Tarea 3: Modelo de rutas en la app

**Files:** Modify `src/lib/roadmap.ts`, `src/features/ruta/roadmapApi.ts`, `useRoadmap.ts`, `RoadmapGate.tsx`, `progressModel.ts`, `src/features/ajustes/settingsApi.ts`. Create `src/lib/roadmap.test.ts`.

**Produces:**
- `Track { id; order; title; goal; phases: readonly Phase[]; checklist: readonly ChecklistItem[] }`, `Roadmap { tracks: Track[] }`
- `findTrack(tracks, id)`, `resolveActiveTrack(tracks, id: string | null | undefined): Track | undefined`, `allPhases(tracks)`, `trackOfTarget(tracks, { topicId, projectPhaseId })`, `activeFirst(tracks, activeId)`, `trackPhaseLabel(track, phase)` → `«Ingeniería de datos · Fase 1»`
- `RoadmapData { roadmap; progress; activeTrack: Track }`; `useRoadmap` con clave `['roadmap', 'tracks']`
- `UserSettings.active_track_id: string | null`; `checklistDoneCount(snapshot, items)`

- [ ] Tests: `resolveActiveTrack` con id válido, nulo, ausente y de una ruta que no existe; `trackOfTarget` para tema y proyecto; `nextTopic` por ruta: lo en curso de una ruta no cambia la sugerencia de la otra; `toTracks` agrupa y ordena; una fase cuya ruta no está se ignora.
- [ ] Implementar. `RoadmapGate` espera también los ajustes (si fallan o no hay conexión, usa la primera ruta).

### Tarea 4: Cola sin conexión al actualizar

**Files:** Modify `src/app/offlineQueue.test.ts`.

- [ ] Test: estado persistido con la forma vieja (`['roadmap']` con `{title, goal, phases, checklist}`, ajustes sin `active_track_id`, una mutación en pausa) y `buster: 'v1'` → `persistQueryClientRestore` con `persistOptions` la conserva, `resumePausedMutations` la envía una vez y `['roadmap','tracks']` está vacío.

### Tarea 5: Ruta (selector y checklist por ruta)

**Files:** Create `src/components/ui/Tabs.tsx`, `src/features/ruta/TrackSelector.tsx`, `src/features/ruta/useActiveTrack.ts`. Modify `RoadmapPage`, `OverviewCard`, `PhaseList`, `ChecklistSection`, `NextTopicCard`, `PhasePage`, `TopicPage`, `DesignSystemPage`, `ruta.test.tsx`.

**Produces:** `Tabs<T>({ label, options, value, onChange, panelId })`; `useSetActiveTrack(): (id: string) => void`; `NextTopicCard({ track, progress, showTrack? })`.

- [ ] Tests: automatización sigue igual (2 de 100, 1/9, 1/14); cambiar de ruta muestra 13 fases, `0 de 110`, `0/13`, `0 de 15` y guarda `{ active_track_id: 'ingenieria-datos' }`; con `active_track_id` guardado abre en esa ruta; `/ruta?ruta=` la muestra y la guarda; si guardar falla no reintenta en bucle; una sola ruta → sin selector; ruta sin fases → «Esta ruta está vacía»; marcar `de-c1` no cambia la cuenta de automatización.
- [ ] Implementar: pestañas `hidden lg:block`, desplegable `lg:hidden`.

### Tarea 6: Inicio y Estudiar

**Files:** Create `src/features/inicio/TrackProgressCard.tsx` (reemplaza `TotalProgressCard`). Modify `HomePage`, `ContinueCard`, `studyTargets.ts`, `TargetPicker`, `StudySetup`, `ManualSessionForm`, `ActiveSession`, `ActiveTimerBanner`, `SessionEditForm`, y tests.

**Produces:** `studyTargets(tracks)`, `StudyTarget.trackId/trackTitle`, `searchByTrack(targets, query, limit = 6): { trackId; title; results }[]`, `targetTitle(tracks, ref)`.

- [ ] Tests: dos tarjetas de progreso con enlaces `/ruta?ruta=…`; el siguiente tema es el de la activa; «Seguir estudiando» retoma una sesión de la otra ruta; buscar «sql» o «api» muestra grupos con encabezado, la activa primero y máximo 6 por ruta; Estudiar propone el siguiente de la activa; iniciar un tema `de-` guarda `topicId: 'de-…'`.

### Tarea 7: Historial, CSV y exportación

**Files:** Create `src/features/historial/trackTotals.ts`, `TrackSection.tsx`, `TrackFilter.tsx`. Rename `PhaseMinutesChart` → `MinutesBarChart`. Modify `PhaseSection`, `sessionFilters`, `SessionFiltersForm`, `SessionsSection`, `SessionList`, `SessionRow`, `sessionsApi`, `sessionCsv`, `ExportCsvButton`, `DayDetail`, `HeatmapSection`, `HistoryPage`, `exportApi`, `exportData`, y tests.

**Produces:** `trackTotals(tracks, phaseTotals): { track; minutes; sessions }[]`; `SessionFilters.trackId`; `SessionQuery.scope: { phaseIds; topicIds } | null` (reemplaza `phase`); `SESSION_CSV_HEADER` con `ruta` antes de `fase`; `EXPORT_FORMAT = 2`, `rutas` y `ruta` por registro.

- [ ] Tests: totales por ruta suman sus fases, incluidas las que están en 0; `?ruta=ingenieria-datos` filtra sesiones y fases y no cambia racha, meta ni semanas; cambiar de ruta limpia fase y tema; una fase de otra ruta en la URL se ignora; CSV y JSON llevan la ruta (nula en «Hoy»).

### Tarea 8: Tutor

**Files:** Create `supabase/functions/_shared/tutorTracks.ts` + test. Modify `tutorContext.ts`, `tutorPrompts.ts`, `tutor/data.ts`, `tutor/index.ts`, `tutor/demo.ts`, `TutorWorkspace`, `TutorTargetSelect`, `EmptyChat`, `ModeComposer`, y tests. El cuerpo de la petición no cambia.

**Produces:** `trackProfile({ id, title, goal }): TrackProfile`; `TutorContextData.tracks: ContextTrack[]` y `activeTrackId`; `contextTracks(data): ContextTrack[]` (la del tema o proyecto, o todas en «Hoy»); `buildSystemPrompt(mode, tracks, context, extras?)`.

- [ ] Tests: un tema `de-` → instrucción de ingeniería de datos, sin «tienda de barrio»; uno de automatización conserva sus ejemplos; una ruta desconocida usa el perfil genérico con su título y meta; «Hoy» lleva el progreso de las dos rutas, la activa y «de qué ruta es cada bloque»; las sesiones dicen su ruta.
- [ ] Probar en local con `TUTOR_PROVIDER=demo`.

### Tarea 9: Verificación y documentos

- [ ] `CLAUDE.md`, `README.md`, `docs/SPEC.md`, `docs/PLAN.md` (Fase 8), `docs/SETUP.md`, textos de `index.html` y el manifiesto.
- [ ] `npm run typecheck`, `lint`, `format:check`, `test`, `build`, `db:test`, `db:test:migracion`.
- [ ] Recorrido en el navegador a 360 px y 1280 px, claro y oscuro.
- [ ] Entregar a Diego: SQL, pasos de producción y cómo comprobarlo en PC y móvil. **Parar ahí** hasta su confirmación.
