-- Historial (docs/SPEC.md §4.3): los totales se calculan aquí, no en el navegador.
-- Los días y las semanas son de Bogotá. Una sesión cuenta en el día en que empezó, aunque
-- termine después de la medianoche. Las semanas van de lunes a domingo (date_trunc('week')).
-- security invoker: el RLS de study_sessions deja a cada usuario solo con sus sesiones.

-- Minutos que necesita un día para contar en la racha (se cambia en Ajustes).
alter table public.user_settings
  add column streak_min_minutes integer not null default 15,
  add constraint user_settings_streak_min_range check (streak_min_minutes between 1 and 240);

-- Minutos y sesiones por día. p_from y p_to (opcionales) son días de Bogotá, ambos incluidos.
create function public.study_day_totals(p_from date default null, p_to date default null)
returns table (day date, minutes integer, sessions integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (s.started_at at time zone 'America/Bogota')::date,
    sum(s.duration_minutes)::integer,
    count(*)::integer
  from public.study_sessions s
  where (p_from is null or s.started_at >= p_from::timestamp at time zone 'America/Bogota')
    and (p_to is null or s.started_at < (p_to + 1)::timestamp at time zone 'America/Bogota')
  group by 1
  order by 1;
$$;

-- Minutos y sesiones por semana; week_start es el lunes. p_from (opcional) debe ser un lunes.
create function public.study_week_totals(p_from date default null)
returns table (week_start date, minutes integer, sessions integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    date_trunc('week', s.started_at at time zone 'America/Bogota')::date,
    sum(s.duration_minutes)::integer,
    count(*)::integer
  from public.study_sessions s
  where p_from is null or s.started_at >= p_from::timestamp at time zone 'America/Bogota'
  group by 1
  order by 1;
$$;

-- Minutos y sesiones por fase, de toda la historia. Las sesiones de proyecto suman a su fase.
create function public.study_phase_totals()
returns table (phase_id text, minutes integer, sessions integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(t.phase_id, s.project_phase_id),
    sum(s.duration_minutes)::integer,
    count(*)::integer
  from public.study_sessions s
  left join public.topics t on t.id = s.topic_id
  group by 1
  order by 1;
$$;

revoke execute on function public.study_day_totals(date, date) from public, anon;
grant execute on function public.study_day_totals(date, date) to authenticated;

revoke execute on function public.study_week_totals(date) from public, anon;
grant execute on function public.study_week_totals(date) to authenticated;

revoke execute on function public.study_phase_totals() from public, anon;
grant execute on function public.study_phase_totals() to authenticated;
