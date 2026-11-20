-- Guardar sesiones de estudio en una sola transacción (docs/SPEC.md §4.2).
-- security invoker: corren con los permisos y el RLS del usuario que las llama.

-- Guarda una sesión y actualiza el progreso de su tema o proyecto:
--   p_mark_done = true  → pasa a «hecho»
--   p_mark_done = false → si estaba «pendiente» (o sin fila), pasa a «en curso»; si no, no cambia
-- Va p_topic_id o p_project_phase_id (el otro queda null); el check de la tabla lo exige.
create function public.record_study_session(
  p_started_at timestamptz,
  p_ended_at timestamptz,
  p_duration_minutes integer,
  p_mode public.study_mode,
  p_topic_id text default null,
  p_project_phase_id text default null,
  p_notes text default '',
  p_mark_done boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_status public.progress_status := case when p_mark_done then 'hecho' else 'en_curso' end;
begin
  insert into public.study_sessions
    (topic_id, project_phase_id, started_at, ended_at, duration_minutes, mode, notes)
  values
    (p_topic_id, p_project_phase_id, p_started_at, p_ended_at, p_duration_minutes, p_mode, coalesce(p_notes, ''))
  returning id into v_session_id;

  if p_topic_id is not null then
    insert into public.topic_progress as tp (topic_id, status)
    values (p_topic_id, v_status)
    on conflict (user_id, topic_id) do update
      set status = case
        when p_mark_done then 'hecho'::public.progress_status
        when tp.status = 'pendiente' then 'en_curso'::public.progress_status
        else tp.status
      end;
  else
    insert into public.project_progress as pp (phase_id, status)
    values (p_project_phase_id, v_status)
    on conflict (user_id, phase_id) do update
      set status = case
        when p_mark_done then 'hecho'::public.progress_status
        when pp.status = 'pendiente' then 'en_curso'::public.progress_status
        else pp.status
      end;
  end if;

  return v_session_id;
end;
$$;

-- Termina el temporizador activo del usuario: guarda la sesión con su tema, inicio y modo,
-- y borra el temporizador. Si ya no existe (p. ej. se terminó en otro dispositivo), falla
-- con P0002 y no guarda nada: así una sesión no se puede guardar dos veces.
create function public.finish_active_timer(
  p_ended_at timestamptz,
  p_duration_minutes integer,
  p_notes text default '',
  p_mark_done boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_timer public.active_timer;
  v_session_id uuid;
begin
  select * into v_timer
  from public.active_timer
  where user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'No hay un temporizador activo' using errcode = 'P0002';
  end if;

  v_session_id := public.record_study_session(
    p_started_at => v_timer.started_at,
    p_ended_at => p_ended_at,
    p_duration_minutes => p_duration_minutes,
    p_mode => v_timer.mode::text::public.study_mode,
    p_topic_id => v_timer.topic_id,
    p_project_phase_id => v_timer.project_phase_id,
    p_notes => p_notes,
    p_mark_done => p_mark_done
  );

  delete from public.active_timer where user_id = v_timer.user_id;
  return v_session_id;
end;
$$;

revoke execute on function public.record_study_session(timestamptz, timestamptz, integer, public.study_mode, text, text, text, boolean)
  from public, anon;
grant execute on function public.record_study_session(timestamptz, timestamptz, integer, public.study_mode, text, text, text, boolean)
  to authenticated;

revoke execute on function public.finish_active_timer(timestamptz, integer, text, boolean)
  from public, anon;
grant execute on function public.finish_active_timer(timestamptz, integer, text, boolean)
  to authenticated;
