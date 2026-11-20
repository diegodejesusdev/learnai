-- Sincronización sin conexión (fase 7, docs/SPEC.md §2): las sesiones hechas sin internet
-- esperan en una cola del dispositivo y se suben al volver la conexión. Si un envío se repite
-- (se cortó la red justo después de guardar, o dos dispositivos terminan el mismo
-- temporizador), la sesión no se duplica: cada una lleva un id que genera el dispositivo.

-- El temporizador guarda el id que tendrá su sesión. Se crea al empezar y viaja con él a
-- todos los dispositivos, así que quien lo termine guarda la misma sesión.
alter table public.active_timer
  add column session_id uuid not null default gen_random_uuid();

-- Se reemplazan las dos funciones por versiones que reciben ese id.
drop function public.finish_active_timer(timestamptz, integer, text, boolean);
drop function public.record_study_session(
  timestamptz, timestamptz, integer, public.study_mode, text, text, text, boolean
);

-- Guarda una sesión y actualiza el progreso de su tema o proyecto:
--   p_mark_done = true  → pasa a «hecho»
--   p_mark_done = false → si estaba «pendiente» (o sin fila), pasa a «en curso»; si no, no cambia
-- p_id: id de la sesión generado en el dispositivo. Si ya existe, no hace nada y devuelve ese id
-- (es un reintento de la cola). Sin p_id se genera uno nuevo.
create function public.record_study_session(
  p_started_at timestamptz,
  p_ended_at timestamptz,
  p_duration_minutes integer,
  p_mode public.study_mode,
  p_topic_id text default null,
  p_project_phase_id text default null,
  p_notes text default '',
  p_mark_done boolean default false,
  p_id uuid default null
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
    (id, topic_id, project_phase_id, started_at, ended_at, duration_minutes, mode, notes)
  values
    (coalesce(p_id, gen_random_uuid()), p_topic_id, p_project_phase_id, p_started_at, p_ended_at,
     p_duration_minutes, p_mode, coalesce(p_notes, ''))
  on conflict (id) do nothing
  returning id into v_session_id;

  -- Ya estaba guardada: no se vuelve a tocar el progreso.
  if v_session_id is null then
    return p_id;
  end if;

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

-- Termina el temporizador: guarda su sesión con el id del temporizador (p_session_id) y los
-- datos que tiene el dispositivo, y borra el temporizador activo si es ese mismo.
-- No necesita que el temporizador haya llegado a la base: así funciona aunque se empezara y
-- terminara sin conexión. Repetir la llamada, o terminarlo también en otro dispositivo,
-- no crea una segunda sesión.
create function public.finish_active_timer(
  p_session_id uuid,
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
begin
  v_session_id := public.record_study_session(
    p_started_at => p_started_at,
    p_ended_at => p_ended_at,
    p_duration_minutes => p_duration_minutes,
    p_mode => p_mode,
    p_topic_id => p_topic_id,
    p_project_phase_id => p_project_phase_id,
    p_notes => p_notes,
    p_mark_done => p_mark_done,
    p_id => p_session_id
  );

  delete from public.active_timer
  where user_id = (select auth.uid()) and session_id = p_session_id;

  return v_session_id;
end;
$$;

revoke execute on function public.record_study_session(
  timestamptz, timestamptz, integer, public.study_mode, text, text, text, boolean, uuid
) from public, anon;
grant execute on function public.record_study_session(
  timestamptz, timestamptz, integer, public.study_mode, text, text, text, boolean, uuid
) to authenticated;

revoke execute on function public.finish_active_timer(
  uuid, timestamptz, timestamptz, integer, public.study_mode, text, text, text, boolean
) from public, anon;
grant execute on function public.finish_active_timer(
  uuid, timestamptz, timestamptz, integer, public.study_mode, text, text, text, boolean
) to authenticated;
