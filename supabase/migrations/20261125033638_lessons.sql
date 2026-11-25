-- Lecciones de los temas y lo que has leído (docs/SPEC.md §5.1 y §5.2).
-- Solo agrega dos tablas y una función: no cambia ninguna fila que ya exista.

-- ── Lecciones ────────────────────────────────────────────────────────────────
-- Las carga `npm run seed` desde content/<ruta>/<fase>/<id-del-tema>.md. Un tema puede no tener.
create table public.lessons (
  topic_id text primary key references public.topics (id) on update cascade on delete restrict,
  -- El Markdown, sin el frontmatter.
  content_md text not null,
  -- Tiempo estimado, según el frontmatter.
  minutes integer not null,
  updated date not null,
  -- sha256 del archivo: dice si la copia guardada en un dispositivo sigue al día.
  content_hash text not null,
  constraint lessons_minutes_positive check (minutes > 0)
);

alter table public.lessons enable row level security;
create policy "Lectura para usuarios autenticados"
  on public.lessons for select to authenticated using (true);

revoke all on public.lessons from anon, authenticated;
grant select on public.lessons to authenticated;
grant select, insert, update, delete on public.lessons to service_role;

-- ── Lo leído ─────────────────────────────────────────────────────────────────
-- Va ligado al tema y no a la lección: si se quita o se reemplaza la lección, se conserva.
create table public.lesson_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic_id text not null references public.topics (id) on update cascade on delete restrict,
  -- Cuándo llegaste al final por primera vez. Vacía = aún no.
  read_at timestamptz,
  -- Hasta dónde has llegado (0 a 100). Nunca baja.
  scroll_pct smallint not null default 0,
  primary key (user_id, topic_id),
  constraint lesson_progress_scroll_pct_range check (scroll_pct between 0 and 100)
);

create index lesson_progress_topic_id_idx on public.lesson_progress (topic_id);

alter table public.lesson_progress enable row level security;
create policy "Cada usuario gestiona sus filas" on public.lesson_progress
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.lesson_progress from anon, authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated, service_role;

-- Guarda hasta dónde leíste. Se puede repetir y llegar en cualquier orden (dos dispositivos, o la
-- cola sin conexión que sube tarde): queda el porcentaje más alto y la primera vez que la leíste.
create function public.save_lesson_progress(
  p_topic_id text,
  p_scroll_pct integer,
  p_read_at timestamptz default null
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.lesson_progress as lp (topic_id, scroll_pct, read_at)
  values (p_topic_id, p_scroll_pct, p_read_at)
  on conflict (user_id, topic_id) do update
    set scroll_pct = greatest(lp.scroll_pct, excluded.scroll_pct),
        -- least ignora los nulos.
        read_at = least(lp.read_at, excluded.read_at);
$$;

revoke execute on function public.save_lesson_progress(text, integer, timestamptz)
  from public, anon;
grant execute on function public.save_lesson_progress(text, integer, timestamptz) to authenticated;
