# Varias rutas de estudio: diseño

Aprobado por Diego el 23 nov 2026.

## Intención

LearnAI pasa de una ruta a varias. Ya existe «Automatización para negocios» y se agrega «Ingeniería de datos» (13 fases, 110 temas, 15 ítems). Diego estudia las dos en la misma app, con una sola racha y una sola meta semanal.

**Regla principal:** no se pierde nada del progreso, notas, sesiones ni conversaciones actuales. Los ids actuales de fases, temas y checklist no cambian.

## Metas

- Elegir la ruta y ver su progreso, su siguiente tema y su checklist por separado.
- Agregar una tercera ruta = agregar un JSON en `src/data/routes/` y correr el seed.
- El tutor sabe de qué ruta es el tema y se adapta a ella.

## Fuera de alcance

- Metas o rachas por ruta: todo cuenta junto.
- Cambiar la tabla de progreso, las sesiones o las conversaciones.
- Borrar `curriculum_meta` (otra migración, cuando ya no queden apps viejas instaladas).

## Lo que lo haría un fracaso

- Perder un cambio en la cola sin conexión al actualizar la app.
- Que la app instalada hoy deje de abrir después de la migración.
- Que una fase de una ruta aparezca en otra.

## Restricciones

- **Caché del dispositivo:** `CACHE_VERSION` no cambia (al cambiar, se borra la cola pendiente). Cambia la clave de la consulta de la ruta: así no se lee la forma vieja. Los ajustes guardados en el dispositivo pueden venir sin `active_track_id`.
- **Compatibilidad:** la migración solo agrega. La app y la función del tutor desplegadas hoy siguen funcionando con el esquema nuevo. `curriculum_meta` se conserva.
- **Orden en producción:** respaldo → migración (con confirmación de Diego tras ver el SQL) → función del tutor → app (push) → `npm run seed:cloud`.
- **Petición al tutor:** el cuerpo que envía la app no cambia.

## Enfoques

1. **`tracks` + `track_id` en fases y checklist** (elegido; lo pidió Diego). La migración no modifica los datos de ninguna fila de usuario.
2. Deducir la ruta del prefijo del id: una ruta futura exigiría cambiar código.
3. Tablas por ruta: habría que mover el progreso.

## Decidido por Diego

- Datos: `tracks(id, title, order, goal)`, `track_id` en `phases` y `checklist_items`, ruta activa en `user_settings`, progreso sin cambios.
- `curriculum.json` lleva un bloque `track` con id `automatizacion`, título «Automatización para negocios», order 1.
- Seed de todos los JSON de la carpeta, con upsert.
- Ruta: pestañas en PC, menú desplegable en móvil, recuerda la última elegida.
- Inicio: progreso de cada ruta, siguiente tema de la activa, minutos de hoy totales.
- Estudiar: el buscador muestra las dos rutas, agrupadas.
- Historial: filtro por ruta y gráfica de minutos por ruta; rachas y meta cuentan todo junto.
- Checklist final separada por ruta.
- Tutor: el contexto incluye la ruta y la instrucción de sistema se adapta. «¿Qué estudio hoy?» puede sugerir de cualquiera según el avance.
- Exportar datos y CSV incluyen la ruta.
- Pruebas: migración sobre una copia con datos, seed idempotente con dos rutas, siguiente tema por ruta.

## Decisiones mías (aprobadas con el diseño)

- La columna se llama `sort_order`, como en las demás tablas. `goal` sale del campo `goal` de cada JSON y `title`, de `track.title`.
- `user_settings.active_track_id` es nulo por defecto; nulo = la primera ruta por orden. Si se borra una ruta, vuelve a nulo.
- `track_id` es obligatorio y sin valor por defecto: una fase nunca cae en la ruta equivocada en silencio.
- Los archivos conservan su nombre en `src/data/routes/`; desaparece la copia de la raíz.
- La ruta activa es la última que viste en la página Ruta. Los enlaces a una ruta concreta usan `/ruta?ruta=<id>`.
- «Seguir estudiando» retoma la última sesión, de cualquier ruta. El siguiente tema sale de la activa.
- Buscador de Estudiar: la ruta activa primero y un límite por ruta, para que una no tape a la otra.
- Historial: el filtro de ruta afecta la lista de sesiones y la gráfica por fase. Mapa de calor, semanas, rachas y meta cuentan todo. Los minutos por ruta se suman a partir de los totales por fase (función pura).
- Tutor: un perfil por ruta conocida y uno genérico (título y meta) para rutas futuras. Selector de ruta encima del tema. «Hoy» prioriza los temas en curso de ambas rutas y luego la activa.
- CSV: columna `ruta` antes de `fase`. JSON: bloque `rutas`, `ruta` en cada registro y `formato: 2`.
- Prueba de migración en una base temporal dentro del Postgres local, comparando fila por fila antes y después. La base local de Diego no se toca.

## Queda al constructor

Nombres internos, orden de las tareas, textos y detalles visuales, siempre dentro de las convenciones de `CLAUDE.md`.
