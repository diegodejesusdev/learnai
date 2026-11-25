# LearnAI

App web personal (PWA) para seguir varias rutas de estudio, definidas en [`src/data/routes`](src/data/routes): **Automatización para negocios** (9 fases, 100 temas), **Ingeniería de datos** (13 fases, 110 temas) y **Cloud** (14 fases, 122 temas), cada una con sus proyectos y su checklist final. Funciona en PC y en móvil, se instala como app y sigue funcionando sin conexión.

- **Inicio:** minutos de hoy, racha, meta semanal, «Seguir estudiando» y el progreso de cada ruta.
- **Ruta:** elegir ruta; fases, temas, estados, notas, proyectos y checklist.
- **Lecciones:** cada tema puede tener una, para leerla en el móvil o el PC, también sin conexión.
- **Estudiar:** temporizador Pomodoro o libre, y sesiones manuales.
- **Historial:** mapa de calor, rachas, gráficas, lista editable y CSV.
- **Tutor IA:** conoce la lección del tema; explica, hace quizzes, revisa proyectos y propone qué estudiar hoy.

Producción: https://learnai-tan.vercel.app

Más detalle en [`docs/SPEC.md`](docs/SPEC.md) (qué hace y por qué), [`docs/PLAN.md`](docs/PLAN.md) (fases) y [`docs/SETUP.md`](docs/SETUP.md) (configuración de Supabase, Google, el tutor y Vercel). Las convenciones del código están en [`CLAUDE.md`](CLAUDE.md).

## Stack

React 19 + Vite 8 + TypeScript, Tailwind 4, React Router, TanStack Query (con caché persistida para usarla sin conexión), vite-plugin-pwa, Supabase (Postgres con RLS, Auth y Edge Functions), Recharts y Vercel.

## Requisitos

- Node 22 o más reciente.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto (Supabase local corre en Docker).
- Para el tutor: una clave de Gemini ([Google AI Studio](https://aistudio.google.com/apikey)) o de Anthropic.

## Correr en local

```bash
npm install
npm run db:start                 # Supabase local: crea la base y aplica las migraciones
cp .env.example .env.local       # y completa con lo que muestra: npx supabase status
npm run seed                     # carga las rutas y las lecciones en la base local
npm run dev                      # http://localhost:5173
```

- **Entrar:** en `/login` escribe tu correo. El correo llega a Mailpit (http://127.0.0.1:54324), con un enlace y un código de 6 dígitos.
- **Tutor en local:**
  1. Copia la sección «Tutor IA» de `.env.example` a `supabase/functions/.env`.
  2. En otra terminal: `npx supabase functions serve tutor`.
  3. Con `TUTOR_PROVIDER=demo` responde sin clave y sin costo.
- **Sesiones de prueba para el Historial:** `npm run seed:sesiones -- --correo <tu correo>`. Solo funciona en local.

### Desde el móvil (misma Wi-Fi)

1. En `.env.local`, cambia `VITE_SUPABASE_URL` a `http://<IP-de-tu-PC>:54321`.
2. Corre `npm run dev:host` y abre `http://<IP-de-tu-PC>:5173` en el móvil.
3. Entra con el código del correo, que lees en Mailpit desde el PC.

La instalación como app y el modo sin conexión necesitan HTTPS: pruébalos con la URL de Vercel.

### Comandos

```bash
npm run typecheck      # TypeScript (app, scripts y Edge Function)
npm run lint           # ESLint
npm run format         # Prettier (format:check solo revisa)
npm test               # Vitest
npm run build          # build de producción en dist/ (con el service worker)
npm run preview        # sirve dist/ en local
npm run db:test        # pruebas de la base (RLS, funciones, seguridad)
npm run db:test:migracion  # la migración de las rutas sobre una copia con datos
npm run db:types       # regenera src/types/database.ts tras una migración
npm run pwa:icons      # regenera los íconos de la app desde public/icon-wine.svg
```

## Desplegar

El orden importa: **primero la base, después la función del tutor y al final el código.** Si la app nueva llega antes que la base, falla en producción.

1. **Base (Supabase en la nube).** Solo la primera vez: `npx supabase login` y `npx supabase link --project-ref <ref>`.
   ```bash
   npx supabase db push --remote --dry-run   # qué migraciones faltan
   npx supabase db push --remote
   ```
2. **Tutor** (si cambió la función o sus secretos):
   ```bash
   npx supabase secrets set --env-file supabase/functions/.env   # claves de IA: solo aquí
   npx supabase functions deploy tutor
   ```
3. **App (Vercel):** se despliega sola con cada push a `main`. En Vercel deben estar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (la clave publicable). Nunca la clave secreta ni las de IA.
   ```bash
   git push origin main
   ```
4. **Login:** en Supabase → Authentication → URL Configuration, el Site URL es la URL de Vercel. También debe estar en Redirect URLs (ver `docs/SETUP.md` §2.4).

Los usuarios con la app abierta ven el aviso «Hay una versión nueva de LearnAI» con el botón «Actualizar».

## Actualizar o agregar rutas

Cada ruta es un archivo de [`src/data/routes`](src/data/routes). Para cambiar una:

1. Edita su JSON. Puedes agregar temas, cambiar títulos, detalles u orden. **No renombres los ids** (`f1-t5`, `de-f1-t4`…): el progreso, las notas y las sesiones están ligados a ellos.
2. Carga el cambio:
   ```bash
   npm run seed          # base local
   npm run seed:cloud    # nube (usa .env.cloud con la clave secreta; nunca va al repo)
   ```
   El seed carga todas las rutas y las lecciones con *upsert* por id y se puede repetir sin duplicar. Si quitaste un id del JSON, no lo borra (tu progreso está ligado a él): lo lista como aviso.

**Para agregar una ruta**, crea un JSON en esa carpeta con la misma forma y su bloque `track`, y corre el seed:

```json
{
  "version": 1,
  "track": { "id": "mi-ruta", "title": "Mi ruta", "order": 4 },
  "title": "Ruta de aprendizaje: Mi ruta",
  "goal": "Qué quiero lograr.",
  "phases": [],
  "final_checklist": []
}
```

- Usa un prefijo propio en todos los ids (por ejemplo, `mr-f0`, `mr-f0-t1`, `mr-c1`): solo minúsculas, números y guiones.
- Si un id ya lo usa otra ruta, el seed se detiene sin escribir nada.
- El tutor usa un perfil genérico con el título y la meta. Para afinarlo, agrega un perfil en `supabase/functions/_shared/tutorTracks.ts` y despliega la función.

## Agregar o cambiar lecciones

Una lección es un archivo `content/<ruta>/<fase>/<id-del-tema>.md`. No hay que tocar código:

1. Copia los archivos a su carpeta. Por ejemplo, los de la fase 1 de Cloud, a `content/cloud/cl-f1/`.
2. Cárgalos:
   ```bash
   npm run seed          # base local
   npm run seed:cloud    # nube: aparecen en la app al volver a abrirla
   ```
3. Guárdalos en git cuando quieras (la app los lee de Supabase, no del repo).

Cada archivo empieza con su frontmatter y sigue con las secciones de siempre (Objetivo, Lo esencial, Explicación, Ejemplo práctico, Errores comunes, Práctica, Repaso, Respuestas y Para profundizar):

```markdown
---
id: cl-f1-t1
track: cloud
phase: cl-f1
title: Archivos, permisos y usuarios
minutes: 25
updated: 2026-11-30
---

## Objetivo
```

- El archivo se llama como el `id`, y ese tema debe existir. Si no existe, si la ruta o la fase no son las suyas, o si el frontmatter está mal, el seed se detiene **sin cargar nada** y dice qué archivo corregir.
- Para corregir una lección, edita el archivo y repite el seed.
- Si quitas un archivo, la lección no se borra de la base: el seed lo avisa.

## Seguridad

- En el navegador solo va la clave publicable de Supabase. La protege RLS: toda tabla con datos del usuario solo deja ver y cambiar sus propias filas.
- La clave secreta de Supabase solo la usa el seed, desde `.env.local` o `.env.cloud`.
- Las claves de IA solo existen como secretos de la Edge Function.
- La función `tutor` exige una sesión válida (responde 401 sin ella) y tiene un límite diario de mensajes.
- `npm run db:test` incluye una prueba que falla si una tabla queda sin RLS o si `anon` recibe permisos.
