# LearnAI

App web personal (PWA) para seguir una ruta de estudio sobre automatización para pequeños negocios: 9 fases, 100 temas, 9 proyectos y una checklist final, definidos en [`curriculum.json`](curriculum.json). Funciona en PC y en móvil, se instala como app y sigue funcionando sin conexión.

- **Inicio:** minutos de hoy, racha, meta semanal y «Seguir estudiando».
- **Ruta:** fases, temas, estados, notas, proyectos y checklist.
- **Estudiar:** temporizador Pomodoro o libre, y sesiones manuales.
- **Historial:** mapa de calor, rachas, gráficas, lista editable y CSV.
- **Tutor IA:** explica, hace quizzes, revisa proyectos y propone qué estudiar hoy.

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
npm run seed                     # carga curriculum.json en la base local
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
npm run db:types       # regenera src/types/database.ts tras una migración
npm run pwa:icons      # regenera los íconos de la app desde public/favicon.svg
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

## Actualizar la ruta (curriculum.json)

El contenido de la ruta vive en `curriculum.json`, en la raíz. Para cambiarlo:

1. Edita `curriculum.json`. Puedes agregar temas, cambiar títulos, detalles u orden. **No renombres los ids** (`f1-t5`…): el progreso, las notas y las sesiones están ligados a ellos.
2. Copia el archivo a la app: `cp curriculum.json src/data/curriculum.json`. Si te olvidas, `npm test` falla.
3. Carga el cambio:
   ```bash
   npm run seed          # base local
   npm run seed:cloud    # nube (usa .env.cloud con la clave secreta; nunca va al repo)
   ```
   El seed hace *upsert* por id y se puede repetir sin duplicar. Si quitaste un id del JSON, no lo borra (tu progreso está ligado a él): lo lista como aviso.
4. Haz commit y push para que la app publicada lleve la copia nueva.

## Seguridad

- En el navegador solo va la clave publicable de Supabase. La protege RLS: toda tabla con datos del usuario solo deja ver y cambiar sus propias filas.
- La clave secreta de Supabase solo la usa el seed, desde `.env.local` o `.env.cloud`.
- Las claves de IA solo existen como secretos de la Edge Function.
- La función `tutor` exige una sesión válida (responde 401 sin ella) y tiene un límite diario de mensajes.
- `npm run db:test` incluye una prueba que falla si una tabla queda sin RLS o si `anon` recibe permisos.
