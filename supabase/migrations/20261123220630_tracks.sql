-- Varias rutas de estudio (docs/SPEC.md §5.1).
-- Solo agrega: una tabla de contenido y tres columnas. No cambia los datos de ninguna fila del
-- usuario (progreso, notas, sesiones, conversaciones) ni el id de ninguna fase, tema o ítem.
-- curriculum_meta se conserva: la leen las apps instaladas antes de este cambio.

-- ── Rutas ────────────────────────────────────────────────────────────────────
create table public.tracks (
  id text primary key,
  sort_order integer not null,
  title text not null,
  goal text not null default ''
);

alter table public.tracks enable row level security;
create policy "Lectura para usuarios autenticados"
  on public.tracks for select to authenticated using (true);

revoke all on public.tracks from anon, authenticated;
grant select on public.tracks to authenticated;
grant select, insert, update, delete on public.tracks to service_role;

-- La ruta que ya existía. El seed la vuelve a escribir (mismo id) desde curriculum.json.
insert into public.tracks (id, sort_order, title, goal)
values (
  'automatizacion',
  1,
  'Automatización para negocios',
  'Poder vender e implementar automatizaciones a pequeños negocios en unas 20 semanas (10 h/semana).'
);

-- ── Cada fase y cada ítem de checklist pertenece a una ruta ──────────────────
-- Los temas no la necesitan: la heredan de su fase. Sin valor por defecto: así una fase nueva
-- nunca cae en la ruta equivocada sin que nadie lo note.
alter table public.phases
  add column track_id text references public.tracks (id) on update cascade on delete restrict;
update public.phases set track_id = 'automatizacion';
alter table public.phases alter column track_id set not null;
create index phases_track_id_sort_order_idx on public.phases (track_id, sort_order);

alter table public.checklist_items
  add column track_id text references public.tracks (id) on update cascade on delete restrict;
update public.checklist_items set track_id = 'automatizacion';
alter table public.checklist_items alter column track_id set not null;
create index checklist_items_track_id_sort_order_idx
  on public.checklist_items (track_id, sort_order);

-- ── Ruta activa del usuario ──────────────────────────────────────────────────
-- Vacía = la primera ruta. Los ajustes existentes no se tocan: la columna nueva empieza vacía.
alter table public.user_settings
  add column active_track_id text references public.tracks (id) on update cascade on delete set null;
create index user_settings_active_track_id_idx on public.user_settings (active_track_id);
