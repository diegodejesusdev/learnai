-- Tutor IA (docs/SPEC.md §4.4): resultados de quiz, límite diario y fragmentos a las notas.
-- Las conversaciones y los mensajes ya existen (migración user_tables).

-- ── Límite diario ────────────────────────────────────────────────────────────
-- La Edge Function cuenta los mensajes del usuario desde las 00:00 de Bogotá.
create index tutor_messages_user_created_idx on public.tutor_messages (user_id, created_at desc);
-- Este índice ya lo cubre el anterior (mismo primer campo).
drop index public.tutor_messages_user_id_idx;

-- Permite que un resultado de quiz referencie (mensaje, usuario) y no el mensaje de otra persona.
alter table public.tutor_messages add constraint tutor_messages_id_user_key unique (id, user_id);

-- ── Resultados de quiz ───────────────────────────────────────────────────────
-- Uno por quiz (mensaje del tutor). Repetir el quiz reemplaza el resultado.
create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  message_id uuid not null,
  topic_id text not null references public.topics (id) on update cascade on delete restrict,
  score integer not null,
  total integer not null,
  -- Índice de la opción elegida en cada pregunta, en orden.
  answers smallint[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_id),
  foreign key (message_id, user_id)
    references public.tutor_messages (id, user_id) on delete cascade,
  constraint quiz_results_total_range check (total between 1 and 20),
  constraint quiz_results_score_range check (score between 0 and total),
  constraint quiz_results_answers_count check (cardinality(answers) = total)
);

create index quiz_results_user_created_idx on public.quiz_results (user_id, created_at desc);
create index quiz_results_topic_id_idx on public.quiz_results (topic_id);

create trigger set_updated_at before update on public.quiz_results
  for each row execute function public.set_updated_at();

alter table public.quiz_results enable row level security;
create policy "Cada usuario gestiona sus filas" on public.quiz_results
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.quiz_results from anon, authenticated;
grant select, insert, update, delete on public.quiz_results to authenticated, service_role;

-- ── Guardar un fragmento del tutor en las notas ──────────────────────────────
-- Agrega al final de las notas en una sola operación (sin leer y reescribir desde el
-- navegador), así no se pisan cambios hechos en otro dispositivo. Crea la fila si no existe.
create function public.append_topic_notes(p_topic_id text, p_text text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.topic_progress as tp (topic_id, notes)
  values (p_topic_id, p_text)
  on conflict (user_id, topic_id) do update
    set notes = case
      when tp.notes = '' then excluded.notes
      else tp.notes || E'\n\n' || excluded.notes
    end;
$$;

create function public.append_project_notes(p_phase_id text, p_text text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.project_progress as pp (phase_id, notes)
  values (p_phase_id, p_text)
  on conflict (user_id, phase_id) do update
    set notes = case
      when pp.notes = '' then excluded.notes
      else pp.notes || E'\n\n' || excluded.notes
    end;
$$;

revoke execute on function public.append_topic_notes(text, text) from public, anon;
grant execute on function public.append_topic_notes(text, text) to authenticated;
revoke execute on function public.append_project_notes(text, text) from public, anon;
grant execute on function public.append_project_notes(text, text) to authenticated;
