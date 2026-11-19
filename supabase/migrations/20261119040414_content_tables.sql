-- Contenido de la ruta (docs/SPEC.md §5.1).
-- Lo carga `npm run seed` desde curriculum.json con upsert por id.
-- Para los usuarios es de solo lectura: no hay políticas ni permisos de escritura.

create table public.curriculum_meta (
  id smallint primary key default 1,
  version integer not null,
  title text not null,
  goal text not null,
  constraint curriculum_meta_single_row check (id = 1)
);

create table public.phases (
  id text primary key,
  sort_order integer not null,
  title text not null,
  summary text not null default '',
  estimated_weeks integer not null,
  project_title text not null,
  project_description text not null default '',
  constraint phases_estimated_weeks_positive check (estimated_weeks > 0)
);

create table public.topics (
  id text primary key,
  phase_id text not null references public.phases (id) on update cascade on delete restrict,
  sort_order integer not null,
  title text not null,
  details text not null default ''
);

create index topics_phase_id_sort_order_idx on public.topics (phase_id, sort_order);

create table public.checklist_items (
  id text primary key,
  sort_order integer not null,
  text text not null
);

-- Row Level Security: lectura solo para usuarios autenticados.
alter table public.curriculum_meta enable row level security;
alter table public.phases enable row level security;
alter table public.topics enable row level security;
alter table public.checklist_items enable row level security;

create policy "Lectura para usuarios autenticados"
  on public.curriculum_meta for select to authenticated using (true);
create policy "Lectura para usuarios autenticados"
  on public.phases for select to authenticated using (true);
create policy "Lectura para usuarios autenticados"
  on public.topics for select to authenticated using (true);
create policy "Lectura para usuarios autenticados"
  on public.checklist_items for select to authenticated using (true);

-- Permisos explícitos (no dependemos de los permisos por defecto del proyecto).
-- anon no ve nada; authenticated solo lee; service_role (el script de seed) escribe.
revoke all on public.curriculum_meta, public.phases, public.topics, public.checklist_items
  from anon, authenticated;
grant select on public.curriculum_meta, public.phases, public.topics, public.checklist_items
  to authenticated;
grant select, insert, update, delete
  on public.curriculum_meta, public.phases, public.topics, public.checklist_items
  to service_role;
