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

## Fase 4: Temporizador

**Objetivo:** sesiones de estudio fiables que sobreviven a recargas y bloqueos.

**Entregables**
- Función pura del estado del temporizador (Pomodoro y libre, con pausas) con tests.
- Selector de destino: tema o proyecto de fase.
- Modos Pomodoro (25/5 configurable) y libre, con pausar y reanudar.
- Persistencia en `localStorage` + `active_timer` y reconciliación al abrir.
- Avisos con la app abierta (sonido, vibración, notificación en escritorio) y opción de mantener la pantalla encendida (Wake Lock).
- Formulario de fin de sesión: duración editable, notas, regla de 12 h, descarte de menos de 1 min y paso automático del tema a «En curso».
- Registro de sesión manual.
- Ajustes del Pomodoro en `user_settings`, junto con la meta semanal y el tema visual (este último, movido desde la fase 3).
- Inicio: minutos de hoy y «Seguir estudiando».

**Cómo verificarla**
- Los tests del cálculo pasan: cambio de bloque exacto, varias pausas, varios ciclos.
- **PC:** iniciar un Pomodoro de prueba (por ejemplo 2/1 min), recargar a mitad de bloque y comprobar que el tiempo sigue bien. Pausar, esperar y reanudar. Terminar y guardar.
- **Móvil:**
  - iniciar, bloquear el móvil 5 min, desbloquear y comprobar que el tiempo es correcto;
  - cerrar la pestaña, abrirla y comprobar que sigue;
  - iniciar en el PC y ver la sesión en curso en el móvil.
- La sesión guardada aparece en Supabase con la duración neta correcta.

---

## Fase 5: Historial

**Objetivo:** ver la constancia y el tiempo invertido.

**Entregables**
- Funciones puras con tests: minutos por día, rachas actual y máxima, minutos por semana y por fase, y CSV.
- Mapa de calor (12 meses en escritorio, 6 en móvil), con detalle al tocar una celda.
- Rachas, barras de las últimas 12 semanas con línea de meta y barras por fase.
- Meta semanal editable.
- Lista de sesiones paginada con filtros, edición y eliminación.
- Exportación a CSV.
- Inicio completo: racha y avance de la meta semanal.

**Cómo verificarla**
- **Tests:**
  - sesiones cerca de la medianoche de Bogotá;
  - racha que incluye hoy y racha que solo llega hasta ayer;
  - semana que cruza un cambio de mes;
  - CSV con comas, comillas, saltos de línea y tildes en las notas.
- **PC:** registrar sesiones manuales en varios días y comprobar el mapa de calor, las rachas y las barras. Editar una sesión y ver que los gráficos cambian. Exportar el CSV y abrirlo en Google Sheets y con `pandas.read_csv`.
- **Móvil:** el mapa de calor se desplaza sin romper el diseño, la lista se puede editar con el dedo y el CSV se descarga.

---

## Fase 6: Tutor IA

**Objetivo:** un tutor útil que conoce la ruta y el progreso, sin exponer claves.

**Requisitos previos**
- Clave de la API de Gemini.
- Opcional: clave de Anthropic para probar el proveedor alternativo.

**Al iniciar, decidir:** el modelo concreto de cada proveedor (para `GEMINI_MODEL` y `ANTHROPIC_MODEL`) y el límite diario.

**Entregables**
- **Edge Function `tutor`:**
  - verificación del JWT;
  - CORS;
  - validación del cuerpo;
  - límite diario.
- **Adaptadores de IA:** `gemini` y `anthropic` con la misma interfaz, elegidos con `AI_PROVIDER`, y streaming hacia el cliente.
- **Constructor de contexto:** ruta, estados, tema o proyecto, notas, actividad y racha.
- **Prompts de sistema** de los 4 modos, en español.
- **Persistencia:** conversaciones y mensajes, con el modelo y los tokens de cada respuesta.
- **UI de chat:**
  - lista de conversaciones;
  - nueva conversación;
  - Markdown seguro;
  - botón para detener;
  - eliminar conversación.
- **Accesos:** «Preguntarle al tutor» en cada tema, «Revisar con el tutor» en cada proyecto y «¿Qué estudio hoy?» en Inicio.

**Cómo verificarla**
- `npx supabase functions serve tutor`: probar los 4 modos y repetir con `AI_PROVIDER=anthropic`.
- Una llamada sin token devuelve 401. Superado el límite diario, aparece un mensaje claro.
- `npm run build` y luego `grep` en `dist/`: no aparecen las claves de IA.
- **PC:** una conversación de quiz completa, que queda guardada.
- **Móvil:** la misma conversación aparece y se puede continuar; el streaming se ve fluido.

---

## Fase 7: PWA y despliegue

**Objetivo:** la app instalada en el móvil y en el PC, en producción.

**Requisitos previos**
- Repositorio en GitHub.
- Cuenta de Vercel conectada al repo desde su panel (sin CLI).

**Al iniciar, decidir:** dominio (el de Vercel o uno propio) e iconos finales.

**Entregables**
- **vite-plugin-pwa:**
  - manifiesto en español (nombre, colores, `display: standalone`);
  - iconos 192/512, *maskable* y `apple-touch-icon`;
  - precache del app shell;
  - aviso «Hay una versión nueva».
- **Caché de datos:** la caché de TanStack Query se persiste, así que los últimos datos se ven sin conexión.
- **Vercel:**
  - variables de entorno de producción;
  - `vercel.json` con rewrites de SPA;
  - deploys de preview por cada push.
- **Supabase de producción:**
  - Site URL y redirect URLs;
  - secrets de la función;
  - `functions deploy tutor`;
  - `ALLOWED_ORIGINS` con el dominio final.
- **Checklist de seguridad** de `docs/SPEC.md` §6, revisada.

**Cómo verificarla**
- Lighthouse en PC sobre la URL de producción, con 90 o más en rendimiento, accesibilidad y buenas prácticas.
- **Android (Chrome):** instalar la app, abrirla desde el icono, iniciar sesión y usar el temporizador.
- **iPhone (Safari):** Compartir → «Añadir a pantalla de inicio», abrirla, iniciar sesión, cambiar el estado de un tema y verlo en el PC.
- Con el modo avión puesto, la app instalada abre y muestra los últimos datos.
- Tras un nuevo deploy, aparece el aviso de versión nueva.

---

## Decisiones pendientes

| Decisión | Cuándo |
|---|---|
| Modelo concreto de Gemini y de Anthropic, y límite diario | Inicio de la fase 6 |
| Dominio e iconos finales | Inicio de la fase 7 |
| Si conviene un despliegue preliminar en Vercel antes de la fase 7 (por ejemplo, para usar la app de verdad desde la fase 4) | Al cerrar la fase 3 |
