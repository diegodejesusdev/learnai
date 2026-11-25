# LearnAI: plan por fases

Cada fase termina con la app funcionando y verificada en PC y en móvil. No se empieza la siguiente fase hasta cerrar la anterior. Al cerrar cada fase, Claude entrega los pasos de prueba (ver «Al cerrar cada fase» en `CLAUDE.md`).

En todas las fases, a partir de la 1, deben pasar estos comandos:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

A partir de la fase 2, también `npx supabase test db`.

---

## Fase 1: Base y diseño ✅ (completada el 18 nov 2026)

**Objetivo:** el esqueleto de la app con su diseño, navegable en PC y móvil, con datos de ejemplo. Todavía sin backend.

**Requisitos previos:** ninguno (Node, npm y git ya están instalados).

**Decidido:** nombre «LearnAI» e icono provisional (`public/favicon.svg`, un camino hacia una meta).

**Entregables**
- **Repo:** `git init`, `.gitignore` (incluye `.env*` salvo `.env.example`), `.env.example` y `vercel.json` (rewrites de SPA).
- **Proyecto base:** Vite + React + TypeScript estricto, Tailwind v4, React Router, TanStack Query, ESLint + Prettier, Vitest y los scripts de `package.json` listados en `CLAUDE.md` (incluido `dev:host`).
- **Navegación:** React Router con `/`, `/ruta`, `/ruta/:phaseId`, `/ruta/tema/:topicId`, `/estudiar`, `/historial`, `/tutor`, `/ajustes`, `/ajustes/diseno`, `/login`, 404 y pantalla de error en español.
- **`AppShell` responsive:** barra inferior en móvil, barra lateral en escritorio, cabecera con acceso a Ajustes y safe areas.
- **Tema:** tokens de color claro/oscuro en `styles/index.css`, con modo automático y un interruptor manual (por ahora guardado en `localStorage`).
- **Sistema de diseño:**
  - Componentes: Button, ButtonLink, Card, CardLink, Badge, StatusBadge, ProgressBar, StatCard, SegmentedControl, TextField, TextAreaField, SelectField, PageHeader, Section y EmptyState.
  - Catálogo en `/ajustes/diseno`.
  - Sheet/Dialog y Spinner se crean cuando se usen por primera vez (fases 2–4).
- **Contenido:** `src/data/curriculum.json` (copia) con tipos en `src/types/curriculum.ts`.
- **Pantallas maquetadas** con datos de ejemplo leídos de `curriculum.json`:
  - Inicio con tarjetas;
  - Ruta (lista de fases y detalle de fase y de tema);
  - Temporizador (visual);
  - Historial (vacío o con datos falsos);
  - Tutor (vista de chat vacía);
  - Login (solo el formulario).
- **`src/lib/dates.ts`** con tests: día de Bogotá de un instante UTC, inicio y fin de la semana (lunes a domingo) y formateo en español.

**Cómo verificarla**
- Los comandos de la fase pasan.
- **PC:** `npm run dev`. Se recorren todas las rutas, se cambia el tema y se revisa el modo responsive de DevTools a 360 px y a 1280 px.
- **Móvil:** `npm run dev:host` y abrir `http://<IP-del-PC>:5173` en la misma Wi-Fi. Comprobar que:
  - no hay scroll horizontal;
  - la barra inferior no tapa contenido;
  - las áreas táctiles son cómodas;
  - el modo oscuro sigue al sistema.
- Los tests de `dates.ts` cubren el caso 23:50 de Bogotá = 04:50 UTC del día siguiente.

---

## Fase 2: Supabase y login ✅ en local (19 nov 2026) · nube: pasos de Diego en `docs/SETUP.md`

**Objetivo:** el esquema completo con RLS, el contenido cargado y el login real, en local y en la nube.

**Requisitos previos**
- Docker Desktop abierto.
- Para la nube: cuenta en Supabase y una vez `! npx supabase login`.
- Para Google: un proyecto en Google Cloud.

**Cambios respecto al plan original (pedidos por Diego)**
- **Login:** enlace mágico + Google en vez de correo y contraseña. El correo trae además un código de 6 dígitos, para la PWA en iPhone y para Supabase local desde el móvil.
- **Valores de estado** en español: `pendiente` / `en_curso` / `hecho`.
- **Contenido** cargado con un script de seed idempotente (`npm run seed`) en vez de una migración generada.
- **Variable:** `VITE_SUPABASE_ANON_KEY` en vez de `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Movido a la fase 3:** guardar el tema en `user_settings`.

**Entregables**
- **CLI:** `supabase` como dependencia de desarrollo y `supabase/config.toml` configurado:
  - URLs de redirección;
  - plantilla de correo en español;
  - Google;
  - `auto_expose_new_tables = false`;
  - servicios sin uso apagados.
- **Migraciones:**
  - `…_content_tables.sql`: contenido, RLS de solo lectura y `GRANT`s;
  - `…_user_tables.sql`: enums, tablas de usuario, FKs, índices, checks, triggers (`updated_at`, `completed_at`, `done_at`, `user_settings` al registrarse), RLS y `GRANT`s.
- **Pruebas pgTAP:** `supabase/tests/database/rls.test.sql` (32 comprobaciones).
- **Seed:**
  - `scripts/seed-curriculum.ts` hace upsert por id, valida duplicados y avisa de ids huérfanos;
  - `scripts/curriculumRows.ts` tiene la lógica pura, con test.
- **Front:**
  - `src/lib/supabase.ts` con tipos generados (`src/types/database.ts`, `npm run db:types`);
  - pantalla «Falta conectar Supabase» si no hay variables;
  - `AuthProvider` / `useAuth` y `RequireAuth`;
  - login (Google, enlace y código), errores en español y cerrar sesión en Ajustes.
- **Ruta lee de Supabase:** fases, temas y checklist, con estados de cargando, error con «Reintentar» y ruta vacía.
- **`.env.example`**, y `.env.local` con las claves locales.

**Cómo verificarla**
- `npm run db:reset && npm run seed && npm run db:test` pasan.
- En Studio (http://127.0.0.1:54323): 9 fases, 100 temas, 14 ítems y 1 fila en `curriculum_meta`.
- **PC:**
  - Abrir cualquier ruta sin sesión lleva a `/login`.
  - Pedir enlace, abrirlo desde Mailpit (http://127.0.0.1:54324) y entrar.
  - Recargar: la sesión sigue.
  - Ruta muestra las 9 fases desde Supabase.
  - Cerrar sesión en Ajustes.
- **Móvil:** en `.env.local`, `VITE_SUPABASE_URL=http://<IP-del-PC>:54321` y `npm run dev:host`. Pedir el correo, leer el código en Mailpit desde el PC y escribirlo en el móvil. Recargar y comprobar que la sesión sigue.
- **Aislamiento:** pasos en `docs/SETUP.md` §4 (pgTAP + prueba manual con una segunda cuenta).

---

## Fase 3: Ruta y progreso ✅ (19 nov 2026)

**Objetivo:** el módulo Ruta funcionando con datos reales.

**Cambios respecto al plan original (pedidos por Diego)**
- **Progreso por temas:** el de una fase = temas hechos / total y el de la ruta = temas hechos / 100. Los proyectos y la checklist se muestran aparte.
- **Etiqueta del tutor:** «Preguntarle al tutor».
- **Movido a la fase 4:** guardar el tema visual en `user_settings`, junto con los demás ajustes.

**Entregables**
- **Datos:**
  - `features/ruta/progressApi.ts`: lectura de todo el progreso, upserts y minutos por tema.
  - `progressModel.ts`: cambios puros sobre la caché.
  - `useProgress.ts`: query y mutaciones optimistas con reversión y aviso.
- **Página Ruta:** progreso total, proyectos y checklist; «Siguiente tema»; fases con barra, estado y filtros; checklist final que se guarda.
- **Página de fase:** temas con estado que cambia de un toque (`StatusToggle`), filtros y editor del proyecto (estado, enlaces validados y notas con autoguardado).
- **Página de tema:** estado, minutos estudiados, «Estudiar este tema», «Preguntarle al tutor» y notas con autoguardado e indicador.
- **Inicio:** «Siguiente tema» y progreso de la ruta con datos reales (minutos y racha siguen de ejemplo).
- **Infraestructura de UI:** `lib/toast.ts` + `Toaster`, `useDebouncedSave`, `SaveIndicator` y campos con `error`.
- **Tests:**
  - Lógica de progreso, siguiente tema, filtros y cambios optimistas.
  - Integración con la UI: un toque, optimismo, reversión con aviso, filtro por URL, autoguardado y checklist.

**Cómo verificarla**
- `npm test`: los tests de `lib/progress.test.ts`, `progressModel.test.ts` y `ruta.test.tsx` pasan.
- **PC:**
  - Marcar temas con un toque y ver subir la barra de la fase y la total.
  - Usar los filtros.
  - Escribir notas, esperar «Guardado», recargar y ver que siguen.
  - Poner un enlace sin `https://` y ver el error.
- **Móvil (mismo usuario):** cambiar algo en el PC y volver a la app en el móvil; el cambio aparece sin recargar.
- **Sin conexión:** modo avión, cambiar un estado (se ve al instante), quitar el modo avión y comprobar en el otro dispositivo que llegó.
- **Error:** si el guardado falla, el estado vuelve atrás y aparece un aviso.

---

## Fase 4: Temporizador ✅ (20 nov 2026, también en la nube)

**Objetivo:** sesiones de estudio fiables que sobreviven a recargas y bloqueos.

**Decisiones de esta fase**
- **Sesión activa:** en `active_timer` + `localStorage`, no en una fila de `study_sessions` con `ended_at` vacío (ver SPEC §4.2).
- **Guardar sesiones:** con funciones SQL transaccionales (`finish_active_timer`, `record_study_session`) en la migración `20261120031944_study_session_functions.sql`.

**Entregables**
- **Lógica pura con tests:**
  - `timerModel.ts`: tiempo activo con pausas, bloques y ciclos Pomodoro, tiempo de estudio y borrador de la sesión;
  - `timerStorage.ts`: copia local y reconciliación;
  - `studyTargets.ts`: buscador;
  - `manualSession.ts`;
  - `timerView.ts`;
  - fechas y horas de Bogotá en `lib/dates.ts`.
- **Estudiar:** buscador de tema con valor por defecto, Pomodoro y Libre, pausar, reanudar y terminar.
  - Formulario de fin: duración, notas, «marcar como hecho» y descarte si dura menos de 1 min.
  - Sesión manual en `/estudiar/manual`.
- **Avisos y pantalla:**
  - Al cambiar de bloque: sonido, vibración, notificación (con permiso) y aviso en la app (`ActiveTimerEffects`).
  - Wake Lock mientras corre.
  - Banner de sesión activa en todas las páginas.
- **Ajustes:** meta semanal y minutos del Pomodoro con autoguardado en `user_settings`; el tema se guarda en la cuenta (`ThemeSync`).
- **Inicio:** minutos de hoy reales.
- **Pruebas pgTAP** de las funciones: transacción, sin duplicados, RLS y anon.

**Cómo verificarla**
- `npm test` (lógica, incluida la prueba en las zonas UTC, Tokio y Los Ángeles) y `npm run db:test` (48 comprobaciones).
- **Recargar:** iniciar, esperar unos segundos, recargar y cerrar y abrir la pestaña. El reloj sigue desde donde iba.
- **PC → móvil:** iniciar en el PC, abrir la app en el móvil y ver el banner y el mismo reloj. Pausar en uno y verlo en pausa en el otro al volver a la app.
- **Terminar:** las notas y «hecho» quedan guardados; la sesión aparece en «Hoy» en Inicio y en los minutos del tema.

---

## Fase 5: Historial ✅ (20 nov 2026, también en la nube)

**Objetivo:** ver la constancia y el tiempo invertido.

**Decisiones de esta fase**
- **Totales en la base:**
  - Funciones SQL `study_day_totals`, `study_week_totals` y `study_phase_totals` (migración `20261120131127_history_stats.sql`), que agrupan por día y semana de Bogotá.
  - Las rachas y la cuadrícula del mapa se calculan en TypeScript sobre esos totales, con funciones puras.
- **Racha:** un día cuenta desde `user_settings.streak_min_minutes`, que vale 15 por defecto y se cambia en Ajustes.
- **Gráficas:** Recharts 3.10, cargado aparte (`lazy`). Se usa la 3.10 y no la 3.11 porque la 3.11 salió hace pocos días.
- **Mapa de calor:** 6 meses en todos los tamaños. En el móvil se desplaza de lado.
- **Editar una sesión** no cambia el estado del tema; borrarla tampoco.

**Entregables**
- **Lógica pura con tests:**
  - `lib/studyStats.ts`: rachas, semanas y textos;
  - `historial/heatmapModel.ts`;
  - `historial/sessionFilters.ts`;
  - `historial/sessionEdit.ts`;
  - `historial/sessionCsv.ts` + `lib/csv.ts`;
  - `inicio/continueStudying.ts`;
  - claves de día en `lib/dates.ts`.
- **Historial:**
  - rachas y meta de la semana;
  - mapa de calor con detalle del día;
  - minutos por semana y por fase, con tabla de datos;
  - lista paginada con filtros en la URL;
  - editar y eliminar con confirmación en `/historial/sesion/:id`;
  - exportar a CSV.
- **Inicio:** «Seguir estudiando», minutos de hoy, racha, meta semanal, siguiente tema (sin repetirlo) y progreso.
- **Ajustes:** mínimo diario para la racha.
- **Datos de prueba:** `npm run seed:sesiones -- --correo <correo>` crea 16 sesiones en Supabase local (nunca en la nube) e imprime lo que se debe ver.
- **Pruebas pgTAP** de los totales: Bogotá frente a UTC, medianoche, cambio de semana, fases, RLS y anon.

**Cómo verificarla**
- `npm test` y `npm run db:test`, que ahora tiene 64 comprobaciones.
- **PC:**
  - `npm run seed:sesiones -- --correo <tu correo>` y comparar Inicio y el Historial con lo que imprime el script.
  - Editar la sesión de 10 min a 20 min: la racha pasa de 3 a 9 días.
  - Exportar el CSV y abrirlo en Google Sheets y con `pandas.read_csv(..., encoding="utf-8-sig")`.
- **Móvil:**
  - el mapa de calor se desplaza sin que la página se mueva de lado;
  - la lista se edita con el dedo;
  - el CSV se descarga.

---

## Fase 6: Tutor IA ✅ (20 nov 2026, también en la nube)

**Objetivo:** un tutor útil que conoce la ruta y el progreso, sin exponer claves.

**Decisiones de esta fase**
- **Variables:** `TUTOR_PROVIDER` (`gemini` por defecto, `anthropic`), `TUTOR_MODEL`, `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` y `TUTOR_DAILY_LIMIT` (50).
- **Modelos por defecto** (documentación revisada el 20 nov 2026): `gemini-4-hydrogen` y `claude-opus-5-5`. Las alternativas más baratas están en `.env.example`.
- **En producción:** `TUTOR_MODEL=gemini-3.6-flash` (secreto de Supabase). El 20 nov, `gemini-4-hydrogen` respondía 503 por alta demanda; `gemini-3.6-flash` respondió y devolvió el quiz con JSON válido. Se cambia con `npx supabase secrets set TUTOR_MODEL=…`, sin volver a desplegar.
- **SDK y dependencias:**
  - Auth con `@supabase/server` (lo que recomienda hoy la documentación de Supabase).
  - SDK oficiales: `@google/genai` 3.0.0 y `@anthropic-ai/sdk` 1.6.0, fijados en `supabase/functions/tutor/deno.json` y con la misma versión en `devDependencies` para revisar los tipos.
- **Código compartido:** lo puro (tipos, validación, contexto, prompts, quiz, errores, NDJSON) vive en `supabase/functions/_shared/`. La app lo importa con el alias `@shared`, y Vitest lo prueba.
- **Errores:** si la respuesta falla, se borra la pregunta: no cuenta para el límite y la app devuelve el texto a la caja.
- **Proveedor `demo`** para probar todo en local sin clave ni costo.

**Entregables**
- **Migración `20261120140732_tutor.sql`:**
  - tabla `quiz_results` (RLS, un resultado por quiz);
  - índice para el límite diario;
  - funciones `append_topic_notes` y `append_project_notes`;
  - 14 pruebas pgTAP.
- **Edge Function `tutor`:**
  - verificación del usuario (401 sin sesión);
  - validación del cuerpo;
  - límite diario con mensaje claro;
  - contexto armado en el servidor;
  - adaptadores Gemini, Anthropic y demo;
  - streaming NDJSON;
  - errores del proveedor en español;
  - guardado de la conversación con el modelo y los tokens.
- **Tutor en la app:**
  - selector de modo arriba;
  - tema o proyecto;
  - historial por tema y modo, con «Nueva»;
  - Markdown con «Copiar» en los bloques de código;
  - quiz con tarjetas, puntaje y resultado guardado;
  - «Guardar en notas»;
  - atajos de tiempo en «Hoy»;
  - botón Detener;
  - caja de texto que funciona con el teclado del móvil.
- **Accesos:** «¿Qué estudio hoy?» en Inicio; Ruta ya tenía «Preguntarle al tutor» y «Revisar con el tutor».
- **Tests:**
  - construcción del contexto, parser del quiz (con JSON inválido), validación del pedido, errores, límite diario, NDJSON y prompts (Vitest);
  - URL del tutor;
  - integración del chat, del quiz y de «Guardar en notas».

**Cómo verificarla**
- `npm test`, `npm run db:test` (78 comprobaciones) y `npm run typecheck`, que también revisa la Edge Function.
- **Local sin clave:**
  - `TUTOR_PROVIDER=demo` en `supabase/functions/.env` y `npx supabase functions serve tutor`;
  - recorrer los 4 modos;
  - la respuesta de prueba repite parte del contexto recibido.
- **Local con clave:** la misma prueba con `TUTOR_PROVIDER=gemini` y luego `anthropic`.
- **Nube:** `docs/SETUP.md` §5: secretos, despliegue y prueba de 401.
- `npm run build` y `grep` en `dist/`: no aparecen claves de IA.

---

## Fase 7: PWA y despliegue ✅ (20 nov 2026, también en la nube)

**Objetivo:** la app instalada en el móvil y en el PC, en producción y usable sin conexión.

**Decisiones de esta fase**
- **Dominio:** el de Vercel (`learnai-tan.vercel.app`).
- **Íconos:** generados desde `public/favicon.svg` con `@vite-pwa/assets-generator` (`npm run pwa:icons`).
- **Cola sin conexión:** mutaciones en pausa de TanStack Query, persistidas con la caché (`@tanstack/react-query-persist-client`, en `localStorage`) y reanudadas con funciones registradas por clave. Ver SPEC §2.
- **Sin duplicar:** ids generados en el dispositivo para las sesiones (migración `20261120151456_offline_sync.sql`). Si no hay `crypto.randomUUID`, como al probar por la IP de la Wi-Fi, se usa `getRandomValues`.
- **CORS:** se dejó `*` en la función del tutor (sin `ALLOWED_ORIGINS`): no usa cookies y exige un token válido.
- **Lighthouse:** desde la versión 12 ya no tiene categoría «PWA». La instalabilidad se revisa a mano: manifiesto, service worker e íconos.
- **Rendimiento:**
  - Cada sección se descarga al abrirla (`lazy` en `routes.tsx`), y el Markdown del tutor también va aparte.
  - El código común va en dos fragmentos, `vendor` y `shared` (`codeSplitting` en `vite.config.ts`). Antes eran unos 45 archivos diminutos en la primera carga.
  - Inicio espera todos sus datos antes de pintar, y Ajustes muestra el formulario deshabilitado mientras carga. Así no hay saltos (CLS 0).
  - Al abrir la app sin conexión, el estado de conexión arranca con `navigator.onLine`.
  - La caché y la cola se guardan enseguida al ocultar o cerrar la página.

**Entregables**
- **PWA:**
  - manifiesto en español con atajos;
  - íconos (64, 192, 512, *maskable*, `apple-touch-icon`, `favicon.ico`);
  - service worker con precache del build;
  - aviso de versión nueva con «Actualizar» (`src/app/UpdatePrompt.tsx`).
- **Sin conexión:**
  - caché persistida;
  - cola persistida y en orden;
  - indicador «Sin conexión · N sin subir / Sincronizando… / Sincronizado»;
  - Ruta sin datos guardados muestra «Sin conexión» en vez de cargar para siempre;
  - el tutor avisa que necesita internet.
- **Base:** `active_timer.session_id`, `record_study_session(p_id)` y `finish_active_timer(p_session_id, …)` idempotentes; pruebas pgTAP de reintentos y de terminar sin conexión; prueba de seguridad general (`security.test.sql`).
- **Ajustes:** «Instalar app» (con los pasos para iPhone) y «Exportar mis datos (JSON)».
- **Vercel:** cabeceras de seguridad y de caché del service worker en `vercel.json`.
- **README** con cómo correr, desplegar y actualizar la ruta.
- **Tests:**
  - cola: el cambio queda en pausa, se envía una vez al volver y sobrevive a «cerrar la app»;
  - indicador de conexión;
  - errores de red;
  - id del dispositivo;
  - instalar;
  - exportación.

**Resultado de Lighthouse** (móvil simulado, build local, carga en frío con sesión, 20 nov 2026):

| Página | Rendimiento | Accesibilidad | Buenas prácticas |
|---|---|---|---|
| `/login` | 95 | 100 | 100 |
| Inicio, Ruta, fase, Estudiar, Tutor | 91 | 100 | 100 |
| Historial, Ajustes | 100 | 100 | 100 |

**Cómo verificarla**
- `npm test`, `npm run db:test`, `npm run build` y `grep` en `dist/` (sin claves privadas).
- **PC:**
  - `npm run build && npm run preview`;
  - DevTools → Application: manifiesto sin errores y service worker activo;
  - Network → Offline: la app abre y muestra la ruta y las notas;
  - hacer cambios sin conexión, recargar y volver a conectarse: llegan una sola vez.
- **Android:** instalar desde Ajustes → «Instalar app» y repetir lo anterior en modo avión.
- **iPhone:** Compartir → Agregar a inicio, entrar con el código del correo y probar en modo avión.
- **Tras un deploy nuevo,** aparece «Hay una versión nueva».

---

## Fase 8: Varias rutas de estudio ✅ publicada en la nube (24 nov 2026)

**Objetivo:** estudiar varias rutas en la misma app sin perder nada del progreso. Diseño: `docs/superpowers/specs/2026-11-23-varias-rutas-design.md`.

**Decisiones de esta fase**
- **Base:** tabla `tracks`, `track_id` en fases y checklist, y `user_settings.active_track_id` (migración `20261123220630_tracks.sql`). Solo agrega: no cambia los datos de ninguna fila del usuario ni ningún id.
- **`curriculum_meta`** se conserva para las apps instaladas antes de este cambio.
- **Caché del dispositivo:** cambia la clave de la consulta de la ruta, no `CACHE_VERSION`: así no se pierden los cambios en cola.
- **Contenido:** un JSON por ruta en `src/data/routes/`. Desaparece la copia de la raíz.
- **Todo junto:** racha, meta semanal, mapa de calor y semanas cuentan todas las rutas.

**Entregables**
- **Seed** de todas las rutas con revisión previa (`routeFiles.ts`, `curriculumRows.ts`, `seedRoutes.ts`): un id repetido o de otra ruta lo detiene sin escribir.
- **Ruta:** pestañas en PC y menú en móvil (`Tabs`, `TrackSelector`), checklist por ruta.
- **Inicio:** progreso de cada ruta y siguiente tema de la activa.
- **Estudiar:** buscador agrupado por ruta.
- **Historial:** minutos por ruta y filtro por ruta; CSV con `ruta`.
- **Ajustes:** la exportación JSON incluye `rutas` y la ruta de cada registro (`formato: 2`).
- **Tutor:** perfil por ruta (`_shared/tutorTracks.ts`) y «Hoy» con todas las rutas.
- **Tests:** migración sobre una copia (`npm run db:test:migracion`), seed idempotente, siguiente tema por ruta y cola sin conexión al actualizar.

**Cómo verificarla**
- `npm test`, `npm run db:test` (104 comprobaciones) y `npm run db:test:migracion`.
- **Orden en producción:** respaldo → `db push --remote` → `functions deploy tutor` → push → `npm run seed:cloud`. Si el seed va antes que la app, la versión anterior mezcla las fases de las dos rutas.
- **PC y móvil:** Ajustes → «Exportar mis datos» antes y después; los números del resumen deben coincidir. Ruta muestra automatización igual que antes, y la segunda ruta con 13 fases y 110 temas.

---

## Fase 9: Rediseño visual ✅ publicado en la nube (24 nov 2026)

**Objetivo:** un diseño minimalista, con poco color y muy legible, pero con carácter. Solo frontend. Diseño: `docs/superpowers/specs/2026-11-24-rediseno-design.md`.

**Decisiones de esta fase**
- **Color:** negro, gris y un vinotinto con un solo significado (lo de ahora y tu avance). El error pasa a anaranjado para no confundirse.
- **Estructura:** un bloque `Hero` por pantalla y listas con líneas en vez de tarjetas. En el PC, dos columnas.
- **Letra:** Inter con tamaño óptico; títulos de 36 a 64 px. Lo más pequeño, 13 px.
- **Sin dependencias nuevas** ni cambios en datos, consultas, direcciones o textos con información.

**Cómo verificarla**
- `npm test` (incluye `scripts/contrast.test.ts`: contraste de los dos temas).
- **PC y móvil:** recorrer las cinco secciones, Ajustes y el acceso, en claro y oscuro.

---

## Fase 10: Lecciones en local (24 nov 2026) · nube: pendiente de publicar

**Objetivo:** leer la lección de cada tema en la app, también sin conexión, y que el tutor la conozca.

**Decisiones de esta fase**
- **Base:** tablas `lessons` (contenido, solo lectura) y `lesson_progress`, y la función `save_lesson_progress` (migración `20261125033638_lessons.sql`). Solo agrega.
- **Contenido:** un `.md` por tema en `content/`. El seed los carga con las rutas; agregar lecciones no exige tocar código ni desplegar.
- **Sin conexión:** el texto va en IndexedDB, no en la caché de `localStorage`.
- **Dependencias nuevas:** `refractor`, `hast-util-to-jsx-runtime` e `idb` (y `fake-indexeddb` en los tests).

**Entregables**
- **Seed** de lecciones con revisión previa: un id que no existe en `topics` lo detiene sin escribir nada.
- **Página de la lección** (`features/leccion`), «Estudiar lección» en el tema, «Lección leída» y «Descargar fase» en la fase.
- **Tutor:** la lección en el contexto y el quiz sacado de ella.
- **Exportar mis datos:** incluye las lecciones leídas (`formato: 3`).
- **Tests:** parser de frontmatter, seed con un id inválido, lección con tabla y código, sin conexión, cola y pgTAP.

**Cómo verificarla**
- `npm test`, `npm run db:test` (126 comprobaciones) y `npm run seed` (debe mostrar `lessons: 9`).
- **Orden en producción:** respaldo → `db push --remote` → `functions deploy tutor` → push → `npm run seed:cloud`.
- **Móvil:** leer `cl-f0-t1` hasta el final (queda «Lección leída»), y abrirla en modo avión.

---

## Decisiones pendientes

| Decisión | Cuándo |
|---|---|
| Modelo concreto de Gemini y de Anthropic, y límite diario | Inicio de la fase 6 |
| Dominio e iconos finales | Inicio de la fase 7 |
| Si conviene un despliegue preliminar en Vercel antes de la fase 7 (por ejemplo, para usar la app de verdad desde la fase 4) | Al cerrar la fase 3 |
