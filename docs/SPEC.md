# LearnAI: especificación

## 1. Objetivo y usuario

LearnAI es una app web personal para estudiar la ruta «Automatización para negocios» (`curriculum.json`). Esa ruta tiene 9 fases (f0–f8), 100 temas, un proyecto por fase y una checklist final de 14 ítems. La meta es ~10 h/semana durante ~20 semanas.

- **Usuario:** una sola persona (Diego), estudiante de ciencia de datos en Colombia.
- **Dispositivos:** PC y móvil, con la misma experiencia en ambos.
- **Idioma:** toda la interfaz en español.
- **Zona horaria:** America/Bogota (UTC-5, sin horario de verano) para todo lo que dependa del día o la semana.

## 2. Requisitos generales

| Requisito | Detalle |
|---|---|
| Mobile-first | Diseño pensado primero para 360 px. En escritorio se aprovecha el ancho. |
| PWA instalable | Manifiesto en español, iconos (incluido *maskable* y `apple-touch-icon`) y aviso cuando hay una versión nueva. |
| Sincronización | Los datos viven en Supabase. Al iniciar sesión en otro dispositivo se ve lo mismo. |
| Login | Enlace mágico por correo (el mismo correo trae un código de respaldo) y Google, con Supabase Auth. Los registros públicos se desactivan después de crear la cuenta. |
| Aislamiento | Toda fila de datos de usuario lleva `user_id` y RLS, aunque haya un solo usuario. |
| Clave de IA | Nunca va en el navegador. El tutor se llama desde una Edge Function. |
| Sin conexión | El app shell y los últimos datos se ven sin internet (caché de TanStack Query persistida). Los cambios se reintentan al volver la conexión y el temporizador sigue funcionando. |

## 3. Navegación y diseño

- **Secciones:** Inicio · Ruta · Estudiar (el temporizador) · Historial · Tutor.
- **Móvil:** barra inferior fija con las 5 secciones (icono + etiqueta) y cabecera con acceso a Ajustes.
- **Escritorio (≥ 1024 px):** barra lateral con las mismas secciones y el contenido centrado con ancho máximo.
- **Tema:** claro/oscuro automático según el sistema, con interruptor manual en Ajustes (`system` / `light` / `dark`). Colores neutros y un solo acento verde azulado. Los estados tienen color y además texto o icono, nunca solo color.
- **Accesibilidad:** áreas táctiles de 44 px o más, foco visible, `aria-label` en español y contraste AA.
- **Rutas:** `/`, `/ruta`, `/ruta/:phaseId`, `/ruta/tema/:topicId`, `/estudiar`, `/historial`, `/tutor`, `/tutor/:conversationId`, `/ajustes`, `/ajustes/diseno` (catálogo del sistema de diseño) y `/login`. Cualquier otra ruta muestra un 404. Sin sesión, todas redirigen a `/login`.
- **Parámetros de consulta:** `/estudiar?tema=<id>` o `?proyecto=<id de fase>` preseleccionan el destino; `/tutor?tema=<id>` o `?proyecto=<id de fase>` preseleccionan el contexto del tutor.

## 4. Módulos

### 4.1 Ruta

**Qué hace**
- Lista de fases en orden, con título, resumen, semanas estimadas y barra de progreso.
- Detalle de fase: temas con su estado, el proyecto de la fase y el progreso.
- Detalle de tema: título, detalles, selector de estado, notas y accesos a «Estudiar este tema» (temporizador) y «Preguntar al tutor».
- Proyecto de fase:
  - estado (pendiente / en curso / hecho);
  - enlace al repositorio y enlace a la demo (los dos opcionales y validados como URL);
  - notas.
- Checklist final: los 14 ítems con casilla y la fecha en que se marcaron.

**Reglas**
- **Estados:** `pendiente` → «Pendiente», `en_curso` → «En curso», `hecho` → «Hecho» (enum `progress_status`). Si un tema no tiene fila de progreso, se considera pendiente.
- **Al pasar a «Hecho»** se guarda `completed_at`. Si vuelve a otro estado, `completed_at` se limpia.
- **Notas:** texto plano con autoguardado (debounce de ~1 s) y un indicador «Guardando… / Guardado».
- **Progreso de una fase** = (temas hechos + proyecto hecho) / (temas de la fase + 1).
- **Progreso total** = (temas hechos + proyectos hechos) / (100 + 9).
- **Checklist:** se muestra aparte como «x / 14».
- **Qué cuenta:** solo lo que está «Hecho». «En curso» no suma.
- **Actualizaciones optimistas:** el cambio se ve al instante y se revierte con un aviso si falla.

### 4.2 Temporizador (sección «Estudiar»)

**Destino de la sesión:** cada sesión va ligada a **un tema o al proyecto de una fase** (exactamente uno de los dos).

**Modos**
- **Pomodoro:** bloques de trabajo y descanso configurables (por defecto 25/5). Los ciclos se repiten hasta que el usuario termina.
- **Libre:** cronómetro ascendente.
- **Pausa y reanudar** en ambos modos.

**Cálculo del tiempo**

El tiempo se calcula de forma determinista, sin contar segundos en memoria. El estado guardado es:
`started_at`, `paused_at` (o nulo), `paused_seconds` acumulados, `mode`, `work_min`, `break_min`.

Con eso:
- `activo = (ahora o paused_at) − started_at − paused_seconds`
- En Pomodoro, con `ciclo = trabajo + descanso`:
  - `n = floor(activo / ciclo)`
  - `r = activo mod ciclo`
  - se está en trabajo si `r < trabajo`
  - `minutos netos = n·trabajo + min(r, trabajo)`
- En modo libre: `minutos netos = activo`.

Así el tiempo es correcto después de recargar, bloquear el móvil, cerrar el navegador o cambiar de pestaña.

**Persistencia del temporizador activo**
- Se guarda en `localStorage` para que se recupere al instante y sin conexión.
- También se guarda en la tabla `active_timer`, para verlo y controlarlo desde otro dispositivo.
- Al abrir la app se reconcilia con la versión más reciente, según `updated_at`.

**Avisos (sin push)**
- Con la app abierta, al cambiar de bloque suena un sonido y vibra donde exista la Vibration API.
- En escritorio, si el usuario dio permiso, también aparece una notificación del sistema.
- Opción «Mantener pantalla encendida» con la Screen Wake Lock API.
- Con el móvil bloqueado no hay alarma. Al volver, el tiempo se muestra correcto.

**Al terminar**
- Se abre un formulario con la duración neta (editable), la hora de inicio y fin, y notas.
- Al guardar se crea la fila en `study_sessions` y se borra `active_timer`.
- Las sesiones de menos de 1 minuto se descartan, previa confirmación.
- Si el temporizador lleva más de 12 h corriendo, se pregunta «¿Olvidaste detenerlo?» y se pide ajustar la hora de fin.
- Al guardar la primera sesión de un tema pendiente, el tema pasa a «En curso».

**Sesión manual:** formulario con destino, fecha, hora de inicio, duración y notas. Queda guardada con `mode = manual`.

**Ajustes:** minutos de trabajo y de descanso del Pomodoro.

### 4.3 Historial

Todos los días y semanas se calculan en hora de Bogotá. Una sesión cuenta en el día de su `started_at`; si cruza la medianoche, no se parte.

- **Mapa de calor:** una celda por día con color según los minutos. Muestra los últimos 12 meses en escritorio y 6 en móvil, con desplazamiento. Al tocar una celda se ven la fecha y los minutos.
- **Rachas:**
  - Un día cuenta si tiene ≥ 1 minuto.
  - La racha actual incluye hoy si ya hay estudio. Si todavía no hay, cuenta hasta ayer, porque la racha no se rompe hasta que termina el día.
  - También se muestra la racha máxima histórica.
- **Horas por semana:** barras de las últimas 12 semanas (lunes a domingo) con una línea de meta semanal.
- **Horas por fase:** barras horizontales. Las sesiones de proyecto suman a su fase.
- **Meta semanal:** por defecto 600 min (las 10 h/semana de la ruta) y editable. Se muestra el avance de la semana actual.
- **Lista de sesiones:**
  - Orden: de la más reciente a la más antigua, paginada.
  - Filtros: rango de fechas, fase y tema.
  - Acciones: editar destino, fecha, hora, duración y notas; eliminar con confirmación.
- **Exportar CSV:**
  - Formato: UTF-8 con BOM, RFC 4180 (separador coma, comillas cuando haga falta), para que abra bien en Google Sheets, Excel y pandas.
  - Columnas: `fecha`, `hora_inicio`, `hora_fin` (en hora de Bogotá), `duracion_min`, `modo`, `fase`, `tema_o_proyecto`, `notas`.
- **Gráficos:** componentes SVG propios, sin librería pesada de gráficos.

### 4.4 Tutor IA

**Modos**

| Modo | Ligado a | Qué hace |
|---|---|---|
| Explicar (`explain`) | Tema | Explica el tema con ejemplos de pequeños negocios colombianos y ajusta el nivel según las preguntas. |
| Quiz (`quiz`) | Tema | Hace una pregunta a la vez (opción múltiple o abierta), corrige, explica y al final resume aciertos y puntos a repasar. |
| Revisar proyecto (`project_review`) | Fase | El usuario pega la descripción, el código o el README. El tutor revisa contra el enunciado del proyecto y da retroalimentación concreta. No abre enlaces. |
| Qué estudiar hoy (`daily_plan`) | Ninguno | Sugiere qué estudiar hoy según los temas en curso, la meta semanal, la racha y las sesiones recientes. |

**Contexto que recibe el modelo** (lo arma la Edge Function en cada llamada):
- Meta de la ruta y lista compacta de fases y temas con su estado.
- Detalles del tema o del proyecto actual y las notas del usuario sobre él.
- Resumen de actividad: minutos de hoy y de la semana, meta, racha y últimas sesiones.
- Las últimas ~20 entradas de la conversación.

**Conversaciones**
- Se guardan en `tutor_conversations` y `tutor_messages`.
- Lista por tema y por modo, botón «Nueva conversación» y opción de eliminar.
- El título se genera a partir del primer mensaje.

**Interfaz**
- Las respuestas llegan en streaming.
- Se muestran en Markdown sin HTML.
- Se puede detener la generación.

**Proveedor**
- Se elige con `AI_PROVIDER` (`gemini` por defecto, `anthropic` como alternativa) y el modelo con `GEMINI_MODEL` o `ANTHROPIC_MODEL`.
- Cada proveedor es un adaptador con la misma interfaz, así que cambiar de proveedor no toca el front.

**Límite y costo**
- Hay un máximo de mensajes por día (`TUTOR_DAILY_LIMIT`); al superarlo se muestra un mensaje claro.
- Se guarda el modelo y los tokens de cada respuesta.

**Privacidad**
- El plan gratuito de la API de Gemini puede usar lo enviado para mejorar sus productos.
- Por eso no se pegan datos personales de clientes en el tutor (relacionado con la fase 7 de la ruta, Ley 1581).

**Accesos al tutor:** «Preguntar al tutor» en cada tema, «Revisar con el tutor» en cada proyecto y «¿Qué estudio hoy?» en Inicio.

### 4.5 Inicio

- **Minutos de hoy** (Bogotá).
- **Racha actual.**
- **Meta semanal:** barra con los minutos de la semana sobre la meta.
- **Último tema:** el de la sesión más reciente. Si no hay sesiones, el tema con progreso actualizado más recientemente. Si tampoco hay, el primer tema pendiente.
- **Botón «Seguir estudiando»:** si hay un temporizador activo, lo reanuda; si no, abre el temporizador con el último tema elegido.
- **Acceso a «¿Qué estudio hoy?»** del tutor.

### 4.6 Ajustes

- Meta semanal en horas o minutos.
- Minutos de trabajo y descanso del Pomodoro.
- Tema visual.
- Cerrar sesión.

### 4.7 Autenticación

- **Métodos:**
  - **Enlace mágico:** escribes tu correo y llega un correo con un botón para entrar.
  - **Código de respaldo:** el mismo correo trae un código de 6 dígitos que se puede escribir en la app. Sirve para la PWA instalada en iPhone (allí el enlace abre Safari y la sesión quedaría en Safari, no en la app) y para Supabase local desde el móvil.
  - **Google:** botón «Continuar con Google». Si Google no está activo en Supabase, el botón se desactiva con una explicación (la app lo consulta en `/auth/v1/settings`).
- **Flujo:** los dos métodos vuelven a `/login`, que detecta la sesión y lleva a la página que se intentaba abrir (o a Inicio).
  - Se usa el flujo implícito de Supabase para que el enlace funcione aunque se abra en otro navegador o dispositivo.
  - Si el enlace venció o Google falló, `/login` muestra el error en español y limpia la URL.
- **Rutas protegidas:** sin sesión solo se ve `/login`. Mientras se resuelve la sesión se muestra «Cargando…».
- **Sesión persistente:** se guarda en `localStorage` y se renueva sola, así que sigue abierta al cerrar y reabrir el navegador o el móvil.
  - Safari en iPhone borra los datos de sitios no visitados en 7 días; instalada como PWA (fase 7) no pasa.
- **Cerrar sesión** (en Ajustes) cierra solo el dispositivo actual y vacía la caché de datos.
- **Registro:** la primera vez que entras se crea tu usuario, y un trigger crea `user_settings` con valores por defecto. Después se desactiva «Allow new users to sign up» en la nube, así que otros correos ven «Este correo no tiene acceso a LearnAI».

## 5. Modelo de datos

Convenciones:
- Todas las fechas son `timestamptz`.
- Las tablas de usuario llevan `user_id uuid not null default auth.uid() references auth.users on delete cascade`.
- `updated_at` se mantiene con un trigger.

### 5.1 Contenido de la ruta (solo lectura)

Se carga desde `curriculum.json` con `npm run seed` (`scripts/seed-curriculum.ts`):
- Hace upsert por id con la clave service role, así que se puede repetir sin duplicar.
- Valida antes que no haya ids repetidos.
- Avisa (sin borrar) de los ids que estén en la base pero ya no en el JSON, para no perder el progreso ligado a ellos.
- Los ids del JSON (`f0`, `f0-t1`, `c1`) son las claves primarias y no se renombran nunca.

```
curriculum_meta(id int pk = 1, version int, title text, goal text)
phases(id text pk, sort_order int, title text, summary text, estimated_weeks int,
       project_title text, project_description text)
topics(id text pk, phase_id text fk → phases, sort_order int, title text, details text)
checklist_items(id text pk, sort_order int, text text)
```

### 5.2 Datos del usuario

```
topic_progress(user_id, topic_id fk → topics, status, notes text default '',
               completed_at timestamptz null, updated_at)
  pk (user_id, topic_id)
  status: enum progress_status ∈ {pendiente, en_curso, hecho}, default pendiente
  completed_at lo pone un trigger al pasar a «hecho» y lo borra al salir

project_progress(user_id, phase_id fk → phases, status, repo_url text null, demo_url text null,
                 notes text default '', completed_at null, updated_at)
  pk (user_id, phase_id)
  repo_url y demo_url deben empezar por http:// o https://

checklist_progress(user_id, item_id fk → checklist_items, done bool, done_at null)
  pk (user_id, item_id)

study_sessions(id uuid pk, user_id, topic_id fk null, project_phase_id fk null,
               started_at, ended_at, duration_minutes int, mode, notes text default '',
               created_at, updated_at)
  check num_nonnulls(topic_id, project_phase_id) = 1
  check duration_minutes > 0 y duration_minutes <= 720
  check ended_at > started_at
  check duration_minutes <= minutos entre started_at y ended_at (el neto no supera lo transcurrido)
  mode ∈ {pomodoro, free, manual}
  índice (user_id, started_at desc)

active_timer(user_id pk, topic_id null, project_phase_id null, mode, started_at,
             paused_at null, paused_seconds int default 0, work_min int, break_min int, updated_at)
  check num_nonnulls(topic_id, project_phase_id) = 1
  mode ∈ {pomodoro, free}

tutor_conversations(id uuid pk, user_id, mode, topic_id fk null, phase_id fk null,
                    title text, created_at, updated_at)
  mode ∈ {explain, quiz, project_review, daily_plan}
  índice (user_id, updated_at desc)

tutor_messages(id uuid pk, conversation_id, user_id,
               role, content text, model text null, tokens_in int null, tokens_out int null,
               created_at)
  fk (conversation_id, user_id) → tutor_conversations (id, user_id) on delete cascade
    (un mensaje solo puede ir en una conversación del mismo usuario)
  role ∈ {user, assistant}
  índice (conversation_id, created_at)

user_settings(user_id pk, weekly_goal_minutes int default 600, pomodoro_work_min int default 25,
              pomodoro_break_min int default 5, theme default 'system', updated_at)
  theme ∈ {system, light, dark}
  se crea con un trigger sobre auth.users al registrar el usuario
```

### 5.3 Cambios frente a la propuesta original y por qué

| Cambio | Por qué |
|---|---|
| El proyecto va como columnas de `phases` (`project_title`, `project_description`). | Es 1:1 con la fase; una tabla aparte solo añade un join. |
| Se añade `sort_order` a `topics` y `checklist_items`. | El JSON da el orden por posición en el arreglo y Postgres no garantiza el orden sin una columna. |
| Se añade `curriculum_meta`. | El tutor necesita la meta de la ruta, y la versión permite saber qué contenido está cargado. |
| El contenido se carga con un script de seed idempotente (`npm run seed`), no con `seed.sql`. | `seed.sql` solo corre en local con `db reset`; el script se puede repetir contra local o la nube cada vez que edites la ruta. |
| El estado es un enum de Postgres con valores en español (`pendiente`, `en_curso`, `hecho`). | Lo pidió Diego en la fase 2. Al ser enum, la base rechaza otros valores y el tipo de TypeScript se genera solo. |
| `completed_at` en temas y proyectos. | Permite saber cuándo se terminó cada cosa (historial y contexto del tutor) sin otra tabla. |
| `link` pasa a ser `repo_url` + `demo_url`. | Un proyecto suele tener las dos cosas. |
| `study_sessions.project_phase_id` con check de un solo destino. | Las horas dedicadas al proyecto de la fase no pertenecen a ningún tema, pero deben sumar a la fase. |
| `mode` incluye `manual`. | Permite distinguir sesiones medidas de sesiones registradas a mano. |
| `duration_minutes` es tiempo neto. | En Pomodoro los descansos y las pausas no cuentan, así que no se puede derivar de `ended_at − started_at`. |
| Nueva tabla `active_timer`. | Sincroniza el temporizador en curso entre dispositivos y sobrevive a borrar los datos del navegador. |
| Nueva tabla `tutor_conversations`; los mensajes cuelgan de ella. | Con solo `tutor_messages(topic_id, mode)` no se distinguen dos quizzes del mismo tema, y los modos «revisar proyecto» y «qué estudiar hoy» no van ligados a un tema. |
| `model`, `tokens_in` y `tokens_out` en los mensajes. | Permite ver el costo real del tutor (tema f6-t13 de la ruta). |
| `theme` en `user_settings` y meta por defecto de 600 min. | El tema sigue al usuario entre dispositivos, y 600 min son las 10 h/semana de la ruta. |
| Sin columna «último tema». | Se deriva de la sesión más reciente, así que no hace falta mantener un dato duplicado. |

### 5.4 Row Level Security

- **Contenido** (`curriculum_meta`, `phases`, `topics`, `checklist_items`): RLS activa, con política de `select` para `authenticated` y sin políticas de escritura.
- **Datos del usuario:** RLS activa y una política por tabla `for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))`.
- **Permisos explícitos:** `anon` no tiene acceso a ninguna tabla. `authenticated` solo lee el contenido y opera sus tablas. `service_role` (el seed) escribe el contenido.
- **Pruebas pgTAP** en `supabase/tests/database/` (`npm run db:test`, 32 comprobaciones):
  - con dos usuarios, ninguno ve ni modifica las filas del otro;
  - nadie puede escribir en el contenido;
  - sin sesión no se lee nada;
  - las restricciones y los triggers funcionan.

## 6. Seguridad

- Los registros públicos se desactivan después de crear el único usuario. Eso cubre el correo y Google: una cuenta de Google nueva tampoco puede crear usuario.
- **Edge Function `tutor`:**
  - Verifica el JWT; sin token válido responde 401.
  - Crea el cliente de Supabase con el token del usuario, así que RLS se aplica también en el servidor y no hace falta la service role.
  - CORS limitado a los orígenes de `ALLOWED_ORIGINS`.
  - Valida el cuerpo de la petición (modo, ids y longitud máxima del mensaje).
- **Secretos:**
  - En local, en `supabase/functions/.env`, que está en `.gitignore`.
  - En producción, con `supabase secrets set`.
- **Antes de cada despliegue:** se busca en `dist/` que no haya claves de IA ni la clave secreta de Supabase.
- **Markdown del tutor:** se renderiza sin HTML crudo.

## 7. Variables de entorno

| Variable | Dónde | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | Front (`.env.local`, Vercel) | URL del proyecto Supabase. En local, la IP del PC si se prueba desde el móvil. |
| `VITE_SUPABASE_ANON_KEY` | Front (`.env.local`, Vercel) | Clave pública (anon o publishable). Es segura en el navegador gracias a RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo el seed (`.env.local` / `.env.cloud`) | Clave service role o secret. Salta RLS: nunca con `VITE_` ni en Vercel. |
| `AI_PROVIDER` | Edge Function | `gemini` (por defecto) o `anthropic`. |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Edge Function | Clave y modelo de Gemini. |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Edge Function | Clave y modelo de Anthropic. |
| `TUTOR_DAILY_LIMIT` | Edge Function | Máximo de mensajes al tutor por día (Bogotá). |
| `ALLOWED_ORIGINS` | Edge Function | Orígenes permitidos para CORS, separados por coma. |

## 8. Decisiones tomadas

- **Login:** enlace mágico + Google, con código de respaldo en el mismo correo. Reemplaza la decisión inicial de correo y contraseña (cambio de Diego en la fase 2).
- **Entorno:** Supabase local con Docker para desarrollar y un proyecto en la nube para producción. A la nube solo llegan migraciones ya probadas en local.
- **Avisos del Pomodoro:** sin notificaciones push. El tiempo es correcto porque se calcula desde la hora de inicio. Con la app abierta suena o vibra, y se puede mantener la pantalla encendida.
- **Tema:** claro/oscuro automático con interruptor manual.
- **CLIs:** Supabase CLI como dependencia de desarrollo (`npx supabase`). Vercel sin CLI, conectado a GitHub desde su panel.

## 9. Fuera de alcance (v1)

- Notificaciones push con el móvil bloqueado.
- Varios usuarios o compartir el progreso.
- Quizzes estructurados con puntaje guardado.
- Que el tutor lea repositorios o páginas por URL.
- Editar el contenido de la ruta desde la app (se edita `curriculum.json` y se genera una migración nueva).
