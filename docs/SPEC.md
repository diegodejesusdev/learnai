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
| PWA instalable | `vite-plugin-pwa`: manifiesto en español (`standalone`, `lang: es-CO`, atajos a Estudiar y «Hoy»), íconos de 64/192/512, *maskable* y `apple-touch-icon` (generados desde `public/favicon.svg` con `npm run pwa:icons`). El service worker guarda todo el build, así que la app abre sin conexión. Cuando hay una versión nueva, aparece «Hay una versión nueva de LearnAI» con el botón «Actualizar»; nunca se actualiza sola a mitad de algo. |
| Sincronización | Los datos viven en Supabase. Al iniciar sesión en otro dispositivo se ve lo mismo. |
| Login | Enlace mágico por correo (el mismo correo trae un código de respaldo) y Google, con Supabase Auth. Los registros públicos se desactivan después de crear la cuenta. |
| Aislamiento | Toda fila de datos de usuario lleva `user_id` y RLS, aunque haya un solo usuario. |
| Clave de IA | Nunca va en el navegador. El tutor se llama desde una Edge Function. |
| Sin conexión | La caché de TanStack Query se guarda en el dispositivo (`localStorage`, 7 días). La ruta, las notas, el progreso y el historial se ven sin internet; el tutor no se guarda. Los cambios sin conexión (estados, notas, proyecto, checklist, ajustes, sesiones manuales y terminar el temporizador) quedan en una **cola**: mutaciones en pausa que se guardan con la caché, sobreviven a cerrar la app y se envían en orden al volver la conexión. **Sin duplicar:** cada sesión lleva un id generado en el dispositivo (el temporizador lo crea al empezar); la base ignora un segundo envío con el mismo id. Editar o borrar sesiones, el tutor y exportar necesitan conexión y lo dicen. Un indicador en la cabecera (móvil) y en la barra lateral muestra «Sin conexión · N sin subir», «Sincronizando…» y «Sincronizado». |

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
- **Página Ruta:**
  - Arriba, el progreso total de la ruta y, aparte, proyectos (x/9) y checklist (x/14).
  - Después, la tarjeta «Siguiente tema».
  - Las 9 fases como tarjetas con título, resumen, semanas estimadas, barra (temas hechos / total) y estado de la fase.
  - Al final, la checklist final en su propia sección.
- **Página de fase:**
  - Progreso de la fase.
  - Lista de temas con su estado, que se cambia con un toque.
  - El proyecto de la fase, con estado, enlace al repositorio, enlace a la demo y notas.
- **Página de tema:**
  - Título y detalles.
  - Estado (selector de tres opciones).
  - Minutos estudiados en ese tema (suma de sus sesiones).
  - Botones «Estudiar este tema» (`/estudiar?tema=<id>`) y «Preguntarle al tutor» (`/tutor?tema=<id>`).
  - Notas con autoguardado.
- **Checklist final:** los 14 ítems con casilla y la fecha en que se lograron.

**Reglas**
- **Estados:** `pendiente` → «Pendiente», `en_curso` → «En curso», `hecho` → «Hecho» (enum `progress_status`). Si un tema no tiene fila de progreso, se considera pendiente.
- **Un toque** en el estado de un tema avanza pendiente → en curso → hecho → pendiente.
- **Al pasar a «Hecho»** se guarda `completed_at`. Si vuelve a otro estado, `completed_at` se limpia (trigger de la base; la app lo imita en el cambio optimista).
- **Progreso** (decisión de Diego en la fase 3):
  - de una fase = temas hechos / temas de la fase;
  - total = temas hechos / 100;
  - los proyectos y la checklist se muestran aparte.
  - Solo cuenta lo «hecho»; «en curso» no suma.
- **Estado de una fase** (para la tarjeta y el filtro): «hecho» si todos sus temas lo están, «en curso» si alguno está empezado, «pendiente» si ninguno.
- **Siguiente tema:** el primer tema «en curso» en el orden de la ruta; si no hay, el primer «pendiente». Si todo está hecho, se muestra una felicitación.
- **Filtros:** Todos / Pendientes / En curso / Hechos.
  - En Ruta filtran las fases (por su estado) y en la página de fase filtran los temas.
  - Cada filtro muestra cuántos elementos hay.
  - El filtro vive en la URL (`?estado=en_curso`), así que se conserva al volver atrás o al recargar.
- **Actualizaciones optimistas** (TanStack Query):
  - El cambio se ve al instante.
  - Si falla, se restaura el valor anterior y aparece un aviso.
  - Sin conexión, el cambio queda en pausa y se envía al volver la conexión (mientras la app siga abierta).
- **Notas y textos del proyecto:**
  - Se guardan solos 0,8 s después de dejar de escribir, una vez por pausa y no por letra.
  - También se guardan al salir del campo, al cambiar de app o al salir de la página.
  - El indicador muestra «Guardando… / Guardado / Sin conexión: se guardará al volver / No se guardó · Reintentar».
  - Si falla, el texto escrito no se borra.
- **Enlaces del proyecto:** opcionales. Si se escribe uno, debe empezar por `http://` o `https://` (igual que el check de la base). Mientras sea inválido, no se guarda y el campo muestra el error.
- **Sincronización entre dispositivos:** el progreso se vuelve a pedir cada vez que la app vuelve a primer plano (o al recuperar la conexión). Un cambio hecho en el PC aparece en el móvil al abrir o volver a la app.

### 4.2 Temporizador (sección «Estudiar»)

**Destino de la sesión:** cada sesión va ligada a **un tema o al proyecto de una fase** (exactamente uno de los dos).
- **Buscador por nombre:** ignora tildes y mayúsculas, y exige todas las palabras. Encuentra temas y proyectos.
- **Destino por defecto:** el que viene en la URL (`?tema=` / `?proyecto=`, p. ej. desde la página de tema); si no hay, el siguiente tema sugerido (§4.1).

**Modos**
- **Pomodoro:** bloques de trabajo y descanso con los minutos de `user_settings` (por defecto 25/5).
  - Los ciclos se repiten hasta terminar.
  - Se muestra el ciclo actual y los ciclos completados (bloques de trabajo terminados).
  - El temporizador guarda los minutos con los que empezó: cambiarlos en Ajustes solo afecta a sesiones nuevas.
- **Libre:** cronómetro hacia arriba.
- **Pausa y reanudar** en ambos modos. El tiempo en pausa no cuenta.

**Cálculo del tiempo** (`features/temporizador/timerModel.ts`)

Determinista y sin contadores en memoria. Lo guardado es:
`started_at`, `paused_at` (inicio de la pausa actual o nulo), `paused_seconds` (pausas ya terminadas), `mode`, `work_min`, `break_min`.

- `activo = (ahora o paused_at) − started_at − paused_seconds`
- En Pomodoro, con `ciclo = trabajo + descanso`:
  - `n = floor(activo / ciclo)` y `r = activo mod ciclo`;
  - se está en trabajo si `r < trabajo`;
  - `tiempo de estudio = n·trabajo + min(r, trabajo)`, porque los descansos no cuentan.
- En modo libre, `tiempo de estudio = activo`.
- La pantalla se repinta cada segundo, pero el valor siempre sale de esa fórmula. Por eso es correcto tras recargar, bloquear el móvil, cerrar la pestaña o cambiar de dispositivo.

**Persistencia del temporizador activo**
- **Dónde se guarda:** en la tabla `active_timer` (una fila por usuario) y en una copia en `localStorage`.
  - No se usa una fila de `study_sessions` con `ended_at` vacío: así `study_sessions` conserva sus restricciones y el historial no mezcla sesiones a medias.
  - Las pausas se guardan como total acumulado más el inicio de la pausa actual, lo que equivale a tener los tramos de pausa para calcular el tiempo.
- **Al abrir la app:** se muestra la copia local al instante y luego se confirma con Supabase (`reconcileTimer`).
  - Gana Supabase, salvo que la copia local tenga cambios sin subir más nuevos (p. ej. una pausa hecha sin conexión); en ese caso se suben.
- **Entre dispositivos:** el otro dispositivo ve los cambios al volver a la app y cada 30 s mientras haya una sesión.
- **Iniciar** usa insert: si ya hay una sesión en otro dispositivo, avisa en lugar de pisarla.
- **Pausar o reanudar** usa update: si la sesión ya se terminó en otro dispositivo, no la resucita, la limpia y avisa.
- **Orden:** las acciones van en fila (`scope` de TanStack Query), así que llegan a Supabase en el orden en que se hicieron.

**Avisos al terminar cada bloque Pomodoro** (sin push)
- Suena un sonido suave de dos notas (Web Audio, sin archivos). Se habilita con el toque en «Iniciar» o «Reanudar», como exige iOS.
- Vibra donde exista la Vibration API (Android; iOS no la tiene).
- Muestra una notificación del navegador si el usuario dio permiso con «Avisarme también con una notificación». En Android hará falta el service worker de la fase 7.
- Muestra un aviso dentro de la app.
- Funciona en cualquier página de la app.
- Solo avisa si el cambio de bloque acaba de pasar (≤ 5 s). Al volver tras un bloqueo largo no suena tarde.
- Con el móvil bloqueado no hay alarma; al volver, el tiempo es correcto.

**Pantalla encendida:** mientras el temporizador corre (no en pausa) se pide la Screen Wake Lock API, y se vuelve a pedir al regresar a la app. Si el navegador no la tiene, no pasa nada.

**Banner:** con una sesión activa, todas las páginas excepto Estudiar muestran arriba un banner pequeño con el tema, el bloque (o «En pausa») y el reloj. Al tocarlo se abre Estudiar.

**Al terminar**
- «Terminar» pausa la sesión (el tiempo deja de correr mientras escribes) y abre el formulario. Este muestra la duración neta (editable entre 1 y los minutos transcurridos, máx. 720), las notas «¿Qué aprendiste?» y la opción «Marcar «tema» como hecho».
- **Guardar** llama a la función SQL `finish_active_timer`, que en una transacción:
  - crea la fila en `study_sessions` con el inicio, el tema y el modo del temporizador;
  - borra `active_timer`;
  - actualiza el progreso (hecho si se marcó; si el tema estaba pendiente, «en curso»).
  - Si la sesión ya se guardó en otro dispositivo, falla (P0002) y no duplica.
- Una sesión de menos de 1 minuto no se guarda: se ofrece descartarla, o volver.
- Descartar una sesión más larga pide confirmación.
- Si quedó corriendo más de 12 h, la duración se limita a 720 min y se puede corregir.

**Sesión manual** (`/estudiar/manual`)
- Campos: tema o proyecto (con el mismo buscador), fecha, hora de inicio (hora de Colombia, sin importar la zona del dispositivo), duración (1–720), notas y «marcar como hecho».
- No puede terminar en el futuro.
- Se guarda con la función SQL `record_study_session` (`mode = manual`).

**Día de una sesión:** el de su `started_at` en hora de Bogotá; una sesión que cruza la medianoche no se parte.

**Ajustes:** meta semanal (horas), minutos de trabajo y de descanso del Pomodoro, con autoguardado en `user_settings`. El tema visual también se guarda allí y se aplica en los demás dispositivos.

### 4.3 Historial

Todos los días y semanas se calculan en hora de Bogotá. Una sesión cuenta en el día de su `started_at`; si cruza la medianoche, no se parte.

**Dónde se calcula**
- **Totales, en la base:** las funciones SQL `study_day_totals`, `study_week_totals` y `study_phase_totals` devuelven una fila por día, semana o fase. El navegador nunca descarga todas las sesiones para sumar; solo lo hace para exportar el CSV.
- **En el navegador, sobre esos totales:**
  - las rachas (`lib/studyStats.ts`);
  - la cuadrícula del mapa de calor (`historial/heatmapModel.ts`).
  - Ambas son funciones puras con tests.

**Mapa de calor**
- Una celda por día con color según los minutos. Muestra los últimos 6 meses, en semanas completas de lunes a domingo.
- En el móvil, cada cuadro mide 24 px y el mapa se desplaza de lado dentro de su tarjeta (abre mostrando lo más reciente). Desde 640 px, los cuadros miden 18 px y caben los 6 meses.
- **Niveles de color:**
  - Sin estudio.
  - Por debajo del mínimo de la racha (tono muy claro).
  - Del mínimo a 59 min.
  - De 1 h a 1 h 59 min.
  - 2 h o más.
  - Con un mínimo alto, los niveles se corren y la leyenda omite los vacíos.
- **Al tocar un día** se ven abajo:
  - la fecha;
  - los minutos;
  - si cuenta para la racha;
  - sus sesiones, que se pueden abrir para editarlas.
- El día elegido va en la URL (`?dia=`).
- Las flechas del teclado mueven entre días.

**Rachas**
- Un día cuenta si suma al menos `user_settings.streak_min_minutes` (15 min por defecto; se cambia en Ajustes).
- La racha actual incluye hoy si ya llega al mínimo. Si todavía no llega, cuenta hasta ayer, porque la racha no se rompe hasta que termina el día.
- Un día por debajo del mínimo rompe la racha igual que un día sin estudio.
- El cambio de semana o de mes no la reinicia.
- También se muestra la racha máxima histórica.

**Gráficas (Recharts)**
- **Minutos por semana:** columnas de las últimas 12 semanas (lunes a domingo) con una línea en la meta semanal.
- **Minutos por fase:** barras horizontales de las 9 fases, con el tiempo al final de cada barra. Las sesiones de proyecto suman a su fase.
- Cada gráfica tiene «Ver los datos», una tabla con los mismos valores, y un tooltip al tocar o pasar por las barras.
- Recharts se descarga solo al abrir el Historial: va en un fragmento aparte, no en el arranque de la app.

**Meta semanal**
- Por defecto 600 min (las 10 h/semana de la ruta); se edita en Ajustes.
- Se muestra el avance de la semana actual.

**Lista de sesiones**
- **Orden:** de la más reciente a la más antigua, de 20 en 20 con «Cargar más».
- **Filtros:**
  - rango de fechas (días de Bogotá, ambos incluidos);
  - fase;
  - tema o proyecto de esa fase.
  - Van en la URL, así que se conservan al volver de editar.
- **Editar** (`/historial/sesion/:id`):
  - Se cambian el tema o proyecto, la fecha, la hora, los minutos netos y las notas.
  - Si no cambias la fecha ni la hora, se conservan el inicio y el fin exactos.
  - Se conserva la duración total con descansos, salvo que los minutos netos la superen.
  - No puede terminar en el futuro.
  - Editar no cambia el estado del tema.
- **Eliminar:** pide confirmación en la misma pantalla. El foco va a «Cancelar».

**Exportar CSV**
- **Formato:**
  - UTF-8 con BOM, para que Excel lea las tildes.
  - RFC 4180: separador coma, comillas solo cuando hace falta y fin de línea CRLF.
  - Abre en Google Sheets, Excel y pandas.
- **Contenido:** todas las sesiones, de la más antigua a la más reciente, sin filtros. Se piden a la base en tandas de 1000.
- **Columnas:**
  - `fecha`, `hora_inicio` y `hora_fin`, en hora de Bogotá; la fecha es la del inicio.
  - `duracion_min`.
  - `modo`.
  - `fase` (por ejemplo, «Fase 1 · Bases técnicas…»).
  - `tipo` (`tema` o `proyecto`).
  - `tema_o_proyecto`.
  - `notas`.
- **Archivo:** `learnai-sesiones-AAAA-MM-DD.csv`.

### 4.4 Tutor IA

**Modos** (selector arriba del chat: Explicar · Quiz · Proyecto · Hoy)

| Modo | Ligado a | Qué hace |
|---|---|---|
| Explicar (`explain`) | Tema | Explica el tema paso a paso con un ejemplo de un pequeño negocio colombiano y termina siempre con una pregunta para comprobar que entendiste. |
| Quiz (`quiz`) | Tema | 5 preguntas de opción múltiple (4 opciones, una correcta). El modelo devuelve JSON con un esquema fijo; la app lo muestra como tarjetas, da el puntaje al final y lo guarda en `quiz_results`. |
| Revisar proyecto (`project_review`) | Fase | Pegas tu solución o un enlace. Da retroalimentación concreta contra el enunciado del proyecto: qué cumple, qué falta, riesgos y mejoras. No abre enlaces: si solo hay un enlace, pide el README, el flujo o el código. |
| ¿Qué estudio hoy? (`daily_plan`) | Ninguno | Propone un plan para la sesión según tu progreso y el tiempo que le digas (atajos de 30 min a 2 h). |

**Edge Function `tutor`** (`supabase/functions/tutor`)
- **Auth:** `@supabase/server` (`withSupabase({ auth: 'user' })`) verifica el token del usuario. Sin sesión responde 401. Todas las consultas van con el cliente del usuario, así que el RLS aplica también aquí.
- **Proveedor:** `TUTOR_PROVIDER=gemini` (por defecto) o `anthropic`, con `GEMINI_API_KEY` o `ANTHROPIC_API_KEY`, y `TUTOR_MODEL`.
  - **Modelos por defecto,** revisados en la documentación de cada proveedor el 20 nov 2026: `gemini-4-hydrogen` (Google lo recomienda para proyectos nuevos y tiene plan gratuito) y `claude-opus-5-5`.
  - **Adaptadores:** cada proveedor es un adaptador con la misma interfaz (`providerTypes.ts`).
  - **Anthropic:** con Opus 5.5 se activa el respaldo del servidor (`fallbacks: 'default'`). Si el modelo declina, la API reintenta con el modelo que recomienda Anthropic.
  - **Demo:** `TUTOR_PROVIDER=demo` responde textos fijos, sin clave y sin costo. Sirve para probar en local y repite parte del contexto recibido. Con `[error429]` o `[timeout]` en el mensaje simula esos errores.
- **Streaming (NDJSON):** la respuesta llega como una línea JSON por evento:
  - `start` con la conversación y el mensaje;
  - `delta` con cada trozo de texto;
  - `done` con el id del mensaje, el modelo y los mensajes que quedan hoy;
  - o `error` con un código y un mensaje en español.
- **Límite diario:** `TUTOR_DAILY_LIMIT` (50 por defecto) cuenta tus mensajes desde las 00:00 de Bogotá. Al llegar al límite responde 429: «Llegaste al límite de N mensajes al tutor por hoy. Se reinicia a la medianoche (hora de Colombia)». Cuando quedan 10 o menos, la app lo avisa.
- **Errores del proveedor:** se traducen a mensajes en español:
  - 429 o cuota agotada;
  - tiempo de espera (120 s);
  - clave inválida;
  - proveedor saturado (5xx o 529);
  - solicitud declinada;
  - quiz con formato inválido;
  - modelo inválido;
  - falta de configuración;
  - error de red.
  - Si la respuesta falla, se borra la pregunta (y la conversación, si era nueva): no queda una pregunta sin respuesta y no cuenta para el límite. La app devuelve el texto a la caja para reintentar.
- **Detener:** el botón corta la conexión. La función lo nota y guarda lo que el modelo alcanzó a escribir.

**Contexto del modelo.** Lo arma el servidor en cada mensaje (`_shared/tutorContext.ts`), nunca el navegador:
- La fecha de hoy en Colombia, la ruta y su meta.
- **Tema** (Explicar y Quiz): su fase (título y resumen), el título y los detalles del tema, su estado y tus notas. Las notas se recortan a 3000 caracteres y se marcan como datos, no como instrucciones.
- **Proyecto** (Revisar proyecto): enunciado, temas de la fase, estado, repositorio, demo y notas.
- Resumen corto del progreso:
  - temas hechos y proyectos hechos;
  - avance por fase;
  - temas en curso;
  - siguientes pendientes;
  - en «Hoy», también los minutos de la semana frente a la meta.
- Tus últimas 5 sesiones, en hora de Colombia.
- **Historial:** las últimas 20 entradas de la conversación. En el Quiz no se reenvían los JSON: solo se pide no repetir las preguntas anteriores.

**Instrucción de sistema** (`_shared/tutorPrompts.ts`):
- En español.
- Tutor paciente y directo para alguien que aprende automatización para negocios en Colombia.
- Usa ejemplos de pequeños negocios colombianos, con montos en pesos.
- Si no sabe algo o puede estar desactualizado (precios, planes, versiones, límites, normas), lo dice y sugiere verificarlo en la documentación oficial.
- Responde en Markdown.

**Quiz** (`_shared/quiz.ts`)
- **Esquema:** `{ questions: [{ question, options[4], correctIndex 0–3, explanation }] }`.
  - A Anthropic se le envía sin `minItems`/`maxItems`, que no los admite.
  - A Gemini, con ellos.
- **`parseQuiz`:**
  - valida JSON, 5 preguntas, 4 opciones distintas, índice correcto y enunciado;
  - acepta el JSON envuelto en un bloque de código;
  - nunca lanza: devuelve el error en español.
- **Repetir el quiz** reemplaza el resultado guardado.

**Interfaz** (`/tutor?modo=explicar|quiz|proyecto|hoy&tema=…&proyecto=…&conversacion=…`)
- El estado va en la URL: los enlaces desde Ruta e Inicio abren lo correcto y recargar no pierde la conversación.
- **Conversaciones:** se guardan por tema (o proyecto) y modo. Se abre la más reciente, hay un selector con las anteriores y un botón «Nueva».
- **Respuestas:** se muestran en Markdown sin HTML, con `react-markdown` + `remark-gfm`. Los bloques de código muestran el lenguaje y un botón «Copiar».
- **Guardar en notas:** en Explicar y Revisar proyecto, abre un editor con la selección (o la respuesta entera) para recortarla. Se agrega al final de las notas del tema o del proyecto con la función SQL `append_topic_notes` / `append_project_notes`, que no pisa cambios hechos en otro dispositivo.
- **Teclado del móvil:**
  - La caja de texto queda fija encima de la barra de navegación.
  - Con el teclado abierto, la barra se oculta y la caja sube con él (`useKeyboardInset` + `interactive-widget=resizes-content`).
  - En el móvil, Enter hace salto de línea; en el PC, Enter envía.
- **Accesos:** «Preguntarle al tutor» en cada tema, «Revisar con el tutor» en cada proyecto y «¿Qué estudio hoy?» en Inicio.

**Privacidad:** el plan gratuito de Gemini puede usar lo que se envía para mejorar sus productos. No se pegan datos personales de clientes en el tutor (relacionado con la fase 7 de la ruta, Ley 1581).

### 4.5 Inicio

- **«Seguir estudiando»**: la tarjeta principal. Abre, en este orden:
  - la sesión en curso, si hay una;
  - si no, el tema o proyecto de la última sesión, si aún no está «hecho»;
  - si no, el siguiente tema sugerido.
  - Sin ninguna sesión todavía, el botón dice «Empezar a estudiar».
- **Minutos de hoy** (Bogotá), con lo que falta para que hoy cuente en la racha.
- **Racha actual y máxima.**
- **Meta semanal:** barra con los minutos de la semana (lunes a domingo) sobre la meta.
- **Siguiente tema:** la misma sugerencia que en Ruta. Solo aparece si no es ya lo que propone «Seguir estudiando».
- **Progreso de la ruta** (temas hechos / 100), que enlaza a Ruta.
- **Acceso a «¿Qué estudio hoy?»** del tutor (fase 6).

### 4.6 Ajustes

- Meta semanal en horas.
- Mínimo diario para la racha, en minutos (de 1 a 240; por defecto 15).
- Minutos de trabajo y descanso del Pomodoro.
- Tema visual.
- **Instalar la app:**
  - botón «Instalar app» cuando el navegador lo permite (Chrome y Edge);
  - en iPhone y iPad, los pasos Compartir → Agregar a inicio;
  - si ya está instalada, lo dice.
- **Exportar mis datos (JSON):** ajustes, progreso con notas, sesiones, conversaciones con el tutor (con sus mensajes) y resultados de quiz, más un resumen. No incluye `user_id`. Archivo `learnai-datos-AAAA-MM-DD.json`.
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
              pomodoro_break_min int default 5, streak_min_minutes int default 15,
              theme default 'system', updated_at)
  theme ∈ {system, light, dark}
  streak_min_minutes entre 1 y 240
  se crea con un trigger sobre auth.users al registrar el usuario
```

**Resultados de quiz** (fase 6):

```
quiz_results(id uuid pk, user_id, message_id, topic_id fk → topics, score int, total int,
             answers smallint[], created_at, updated_at)
  unique (message_id): un resultado por quiz; repetirlo lo reemplaza
  fk (message_id, user_id) → tutor_messages (id, user_id) on delete cascade
  check score entre 0 y total, total entre 1 y 20, una respuesta por pregunta
```

**Funciones SQL** (todas `security invoker`, así que aplican el RLS de quien llama; solo las ejecuta `authenticated`):

```
record_study_session(...)  → uuid   guarda una sesión y pasa el tema o proyecto a «en curso» o «hecho»
finish_active_timer(...)   → uuid   guarda la sesión del temporizador activo y lo borra (una transacción)
study_day_totals(p_from date?, p_to date?)  → (day, minutes, sessions)         por día de Bogotá
study_week_totals(p_from date?)             → (week_start, minutes, sessions)  semanas de lunes a domingo
study_phase_totals()                        → (phase_id, minutes, sessions)    temas + proyecto de cada fase
append_topic_notes(p_topic_id, p_text)      agrega un fragmento al final de las notas del tema (crea la fila)
append_project_notes(p_phase_id, p_text)    lo mismo con las notas del proyecto
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
| `streak_min_minutes` en `user_settings` (fase 5). | Un día cuenta para la racha desde 15 min (decisión de Diego), y se puede cambiar. |
| Totales con funciones SQL y no con vistas (fase 5). | Devuelven tipos sin `null` en los tipos generados, aceptan rangos de fechas y agrupan en Bogotá en un solo lugar. |

### 5.4 Row Level Security

- **Contenido** (`curriculum_meta`, `phases`, `topics`, `checklist_items`): RLS activa, con política de `select` para `authenticated` y sin políticas de escritura.
- **Datos del usuario:** RLS activa y una política por tabla `for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))`.
- **Permisos explícitos:** `anon` no tiene acceso a ninguna tabla. `authenticated` solo lee el contenido y opera sus tablas. `service_role` (el seed) escribe el contenido.
- **Pruebas pgTAP** en `supabase/tests/database/` (`npm run db:test`, 78 comprobaciones en 4 archivos; `rls.test.sql` tiene 32):
  - con dos usuarios, ninguno ve ni modifica las filas del otro;
  - nadie puede escribir en el contenido;
  - sin sesión no se lee nada;
  - las restricciones y los triggers funcionan.

## 6. Seguridad

- Los registros públicos se desactivan después de crear el único usuario. Eso cubre el correo y Google: una cuenta de Google nueva tampoco puede crear usuario.
- **Edge Function `tutor`:**
  - Verifica el JWT con `@supabase/server`; sin token válido responde 401.
  - Usa el cliente de Supabase con el token del usuario, así que RLS se aplica también en el servidor y no hace falta la service role.
  - CORS con las cabeceras estándar de Supabase (`*`). Se acepta porque la función no usa cookies: sin un token de usuario válido no responde nada.
  - Valida el cuerpo de la petición (modo, ids, tema o proyecto existente y largo máximo del mensaje: 20 000 caracteres).
  - En los registros solo escribe códigos de error, nunca el contenido de las conversaciones.
- **Secretos:**
  - En local, en `supabase/functions/.env`, que está en `.gitignore`.
  - En producción, con `supabase secrets set`.
- **Antes de cada despliegue:** se busca en `dist/` que no haya claves de IA ni la clave secreta de Supabase.
- **Markdown del tutor:** se renderiza sin HTML crudo.
- **Prueba de seguridad en la base** (`supabase/tests/database/security.test.sql`). Falla si:
  - una tabla queda sin RLS;
  - una tabla con `user_id` no tiene política con `auth.uid()`;
  - `anon` recibe permisos sobre alguna tabla;
  - el contenido deja de ser de solo lectura;
  - `anon` puede ejecutar alguna función.
- **Cabeceras en Vercel** (`vercel.json`):
  - `X-Content-Type-Options: nosniff`;
  - `Referrer-Policy: strict-origin-when-cross-origin`;
  - `X-Frame-Options: DENY`;
  - `Permissions-Policy` sin cámara, micrófono ni ubicación;
  - `sw.js` y el manifiesto sin caché (`must-revalidate`).

## 7. Variables de entorno

| Variable | Dónde | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | Front (`.env.local`, Vercel) | URL del proyecto Supabase. En local, la IP del PC si se prueba desde el móvil. |
| `VITE_SUPABASE_ANON_KEY` | Front (`.env.local`, Vercel) | Clave pública (anon o publishable). Es segura en el navegador gracias a RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo el seed (`.env.local` / `.env.cloud`) | Clave service role o secret. Salta RLS: nunca con `VITE_` ni en Vercel. |
| `TUTOR_PROVIDER` | Edge Function | `gemini` (por defecto) o `anthropic`; `demo` para probar en local. |
| `TUTOR_MODEL` | Edge Function | Modelo; vacío = `gemini-4-hydrogen` o `claude-opus-5-5`. |
| `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` | Edge Function | La clave del proveedor elegido. |
| `TUTOR_DAILY_LIMIT` | Edge Function | Máximo de mensajes al tutor por día (Bogotá); 50 por defecto. |

Las variables de la Edge Function van en `supabase/functions/.env` en local y con `npx supabase secrets set` en la nube. Nunca llevan `VITE_` ni van a Vercel.

## 8. Decisiones tomadas

- **Login:** enlace mágico + Google, con código de respaldo en el mismo correo. Reemplaza la decisión inicial de correo y contraseña (cambio de Diego en la fase 2).
- **Entorno:** Supabase local con Docker para desarrollar y un proyecto en la nube para producción. A la nube solo llegan migraciones ya probadas en local.
- **Avisos del Pomodoro:** sin notificaciones push. El tiempo es correcto porque se calcula desde la hora de inicio. Con la app abierta suena o vibra, y se puede mantener la pantalla encendida.
- **Tema:** claro/oscuro automático con interruptor manual.
- **CLIs:** Supabase CLI como dependencia de desarrollo (`npx supabase`). Vercel sin CLI, conectado a GitHub desde su panel.
- **PWA y sin conexión (fase 7):**
  - La cola usa las mutaciones en pausa de TanStack Query, persistidas con la caché, y no una cola propia. Cada tipo de cambio tiene su clave y su función registrada (`src/app/offlineMutations.ts`), así se reanuda tras cerrar la app.
  - Las sesiones no se duplican gracias a un id del dispositivo: `record_study_session(p_id)` y `finish_active_timer(p_session_id, …)`, con `active_timer.session_id`. Terminar el temporizador ya no depende de que esté en la base: funciona aunque se empezara sin conexión.
  - Si dos dispositivos terminan el mismo temporizador, vale el primero.
- **Tutor (fase 6):**
  - Variables `TUTOR_PROVIDER` / `TUTOR_MODEL` (las pidió Diego; reemplazan `AI_PROVIDER` y un modelo por proveedor).
  - Límite de 50 mensajes al día.
  - Quiz de 5 preguntas con JSON de esquema fijo y resultado en `quiz_results`.
  - Sin `ALLOWED_ORIGINS`: la protección es el token del usuario.
- **Historial (fase 5):**
  - Gráficas con Recharts, que reemplaza la idea inicial de SVG propio; lo pidió Diego.
  - Recharts se carga aparte para no pesar en el arranque.
  - Un día cuenta para la racha desde 15 min, configurable (antes: desde 1 min).
  - El mapa de calor muestra 6 meses en todos los tamaños.

## 9. Fuera de alcance (v1)

- Notificaciones push con el móvil bloqueado.
- Varios usuarios o compartir el progreso.
- Quizzes estructurados con puntaje guardado.
- Que el tutor lea repositorios o páginas por URL.
- Editar el contenido de la ruta desde la app (se edita `curriculum.json` y se genera una migración nueva).
