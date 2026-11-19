# Configuración: Supabase, Google y Vercel

Guía paso a paso de lo que se configura fuera del código. Los comandos se corren en la carpeta del proyecto.

> **Regla de oro de las claves**
> - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` son públicas: van en `.env.local` y en Vercel.
> - La clave **service role / secret** salta RLS: solo va en `.env.local` (la local) o en `.env.cloud` (la de la nube), nunca con prefijo `VITE_` y nunca en Vercel.
> - Todos los `.env*`, salvo `.env.example`, están en `.gitignore`.

---

## 1. Supabase local (desarrollo)

Ya está configurado; `.env.local` tiene las claves locales.

```bash
npm run db:start   # Docker Desktop debe estar abierto. Aplica las migraciones pendientes.
npm run seed       # Carga curriculum.json (se puede repetir sin duplicar)
npm run dev        # http://localhost:5173
```

- **Correos de prueba** (enlace y código): http://127.0.0.1:54324. En local no salen correos reales.
- **Studio** (tablas, SQL, usuarios): http://127.0.0.1:54323.
- **Empezar de cero:** `npm run db:reset && npm run seed`. Borra todos los datos locales, incluidos los usuarios.
- **Desde el móvil:**
  1. En `.env.local`, pon `VITE_SUPABASE_URL=http://<IP-de-tu-PC>:54321`.
  2. Corre `npm run dev:host` y abre `http://<IP-de-tu-PC>:5173` en el móvil.
  3. Entra con el **código** del correo, que lees en Mailpit desde el PC. El enlace del correo local apunta a `127.0.0.1`, que en el móvil es el propio móvil.

---

## 2. Proyecto en la nube

### 2.1 Crear el proyecto
1. Entra a https://supabase.com/dashboard y crea un proyecto (**New project**):
   - Nombre: `learnai`.
   - Región: **East US (North Virginia)**. Es la más cercana a Colombia con buena latencia y coincide con la región por defecto de Vercel.
   - Guarda la **contraseña de la base de datos** en tu gestor de contraseñas; `db link` la pide.
2. Anota el **Project ref**: es el texto de la URL `supabase.com/dashboard/project/<ref>` (también está en Project Settings → General).

### 2.2 Aplicar las migraciones
```bash
npx supabase login                         # una vez; abre el navegador (escríbelo como: ! npx supabase login)
npx supabase link --project-ref <ref>      # pide la contraseña de la base
npx supabase db push --dry-run             # muestra qué migraciones aplicaría, sin tocar nada
npx supabase db push                       # las aplica
```
- Cada vez que haya una migración nueva: pruébala en local (`npm run db:reset && npm run db:test`) y luego corre `npx supabase db push`.
- Para confirmar: en el panel, ve a **Table Editor** y deberías ver `phases`, `topics`, `topic_progress`… con el candado de RLS activo.

### 2.3 Cargar la ruta (seed)
1. En **Project Settings → API Keys** copia:
   - **Publishable key** (`sb_publishable_…`), o en la pestaña *Legacy* la `anon`: es la pública;
   - **Secret key** (`sb_secret_…`), o en *Legacy* la `service_role`: es la privada.
2. Crea `.env.cloud` en la raíz del proyecto, que ya está ignorado por git:
   ```
   SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<secret key>
   ```
3. Corre `npm run seed:cloud`. Debe mostrar `phases: 9`, `topics: 100`, `checklist_items: 14`. Repítelo cada vez que edites `curriculum.json`.

### 2.4 URLs de redirección del login
En **Authentication → URL Configuration**:
- **Site URL:** tu URL de producción de Vercel, p. ej. `https://learnai-xxxx.vercel.app`.
- **Redirect URLs** (añade cada una):
  - `https://learnai-xxxx.vercel.app/**`
  - `https://learnai-*-<tu-usuario-de-vercel>.vercel.app/**`, para las URLs de preview.
  - `http://localhost:5173/**`, solo si algún día apuntas la app local a la nube.

La app pide volver a `<origen>/login`. Si ese origen no está en la lista, Supabase te manda al Site URL.

### 2.5 Plantilla del correo (enlace + código)
En **Authentication → Emails → Templates**, edita **Magic link** y **Confirm signup**:
- Asunto: `Tu acceso a LearnAI`.
- Cuerpo: pega el contenido de `supabase/templates/magic_link.html`.

Sin esto el correo llega en inglés y **sin código**: el enlace funciona, pero no podrías entrar desde la PWA del iPhone.

> El remitente de correo incluido en Supabase tiene un límite muy bajo de correos por hora. Para una sola persona alcanza. Si ves «Ya pediste varios correos», espera un rato. Más adelante se puede conectar un SMTP propio, como Resend.

### 2.6 Google
**En Google Cloud** (https://console.cloud.google.com):
1. Crea un proyecto `LearnAI`.
2. Configura **Google Auth Platform**:
   - **Branding:** nombre `LearnAI` y tu correo de soporte.
   - **Audience:** *External*. Agrega tu correo de Gmail como **Test user**. En modo *Testing* solo los test users pueden entrar, y eso es justo lo que queremos.
3. En **Clients → Create client → Web application**:
   - **Authorized JavaScript origins:** `https://learnai-xxxx.vercel.app` y `http://localhost:5173`.
   - **Authorized redirect URIs:** `https://<ref>.supabase.co/auth/v1/callback`. Para Google en local, agrega también `http://127.0.0.1:54321/auth/v1/callback`.
4. Copia el **Client ID** y el **Client secret**.

**En Supabase:** ve a **Authentication → Sign In / Providers → Google**, actívalo, pega el Client ID y el Client secret, y guarda. El *Callback URL* que muestra ahí es el que va en el paso 3.

**Google en local (opcional):**
1. Crea `supabase/.env` (ignorado por git) con:
   ```
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client id>
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<client secret>
   ```
2. En `supabase/config.toml`, sección `[auth.external.google]`, pon `enabled = true`.
3. Reinicia con `npm run db:stop && npm run db:start`.

Mientras Google no esté activo, el botón aparece desactivado con una nota.

### 2.7 Primer acceso y cerrar el registro
1. Configura Vercel (paso 3) y abre la app en producción.
2. Entra con tu correo o con Google. Así se crea tu usuario, y el trigger crea tu fila en `user_settings`.
3. Verifica en **Table Editor → user_settings** que haya 1 fila con 600 / 25 / 5 / system.
4. En **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up** y guarda. Desde ese momento, cualquier otro correo o cuenta de Google verá «Este correo no tiene acceso a LearnAI».

---

## 3. Vercel

1. En **Project → Settings → Environment Variables**, agrega estas dos, marcando *Production* y *Preview*:
   - `VITE_SUPABASE_URL` = `https://<ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = la *publishable* (o `anon`)
2. Ve a **Deployments**, abre el menú ⋯ del último despliegue y elige **Redeploy**. Vite incrusta las variables al compilar, así que sin redeploy no se aplican.
3. Si ves la pantalla «Falta conectar Supabase», faltan las variables o el redeploy.

Nunca agregues la secret/service role key en Vercel.

---

## 4. Verificar que otra cuenta no ve tus datos

### 4.1 Automático (local)
```bash
npm run db:test
```
Son 32 comprobaciones con dos usuarios simulados:
- B no ve ni modifica las filas de A en ninguna tabla;
- B no puede escribir a nombre de A ni en una conversación de A;
- nadie puede editar el contenido;
- sin sesión no se lee nada.

### 4.2 Manual, con una segunda cuenta real (local o nube)
Funciona igual en Studio local (http://127.0.0.1:54323) y en el panel de la nube:
1. **Crea una segunda cuenta:** en **Authentication → Users → Add user → Create new user**, pon `otra@ejemplo.com`, una contraseña cualquiera y marca *Auto confirm*. Esto funciona aunque el registro esté cerrado.
2. **Copia tu UUID** de la lista de usuarios.
3. **Crea un dato tuyo:** en **SQL Editor**, como `postgres`:
   ```sql
   insert into topic_progress (user_id, topic_id, status, notes)
   values ('<tu-uuid>', 'f0-t1', 'en_curso', 'nota privada');
   ```
4. **Mira como la otra cuenta:** en el selector de rol del SQL Editor, elige **authenticated** e *impersonate* a `otra@ejemplo.com`. Luego corre:
   ```sql
   select * from topic_progress;                    -- 0 filas
   select user_id from user_settings;               -- solo la suya
   update topic_progress set notes = 'hackeado';    -- 0 filas afectadas
   insert into topic_progress (user_id, topic_id)
   values ('<tu-uuid>', 'f0-t2');                   -- error: row-level security
   update phases set title = 'x';                   -- error: permission denied
   ```
5. **Mira como tú:** impersónate a ti mismo, corre `select * from topic_progress;` y verás tu fila con `nota privada` intacta.
6. **Limpia:** como `postgres`, corre `delete from topic_progress where notes = 'nota privada';` y borra `otra@ejemplo.com` en Authentication → Users.
