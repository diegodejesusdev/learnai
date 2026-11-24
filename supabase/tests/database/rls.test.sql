-- Pruebas de seguridad y reglas de la base. Correr con: npx supabase test db
-- Todo ocurre dentro de una transacción que se revierte al final.
begin;
create extension if not exists pgtap with schema extensions;

select plan(32);

-- ── Datos de prueba (como postgres, sin RLS) ─────────────────────────────────
insert into public.phases (id, track_id, sort_order, title, estimated_weeks, project_title)
values ('test-f', 'automatizacion', 99, 'Fase de prueba', 1, 'Proyecto de prueba');
insert into public.topics (id, phase_id, sort_order, title)
values ('test-f-t1', 'test-f', 0, 'Tema de prueba');
insert into public.checklist_items (id, track_id, sort_order, text)
values ('test-c1', 'automatizacion', 99, 'Ítem de prueba');

insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'diego@pgtap.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'otra@pgtap.local', 'authenticated', 'authenticated');

-- ── Trigger de registro ──────────────────────────────────────────────────────
select results_eq(
  $$ select weekly_goal_minutes, pomodoro_work_min, pomodoro_break_min, theme::text
     from public.user_settings where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  $$ values (600, 25, 5, 'system') $$,
  'Al registrarse se crea user_settings con 600 / 25 / 5 / system'
);

-- ── Usuario A (Diego) crea sus datos ─────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

select lives_ok(
  $$ insert into public.topic_progress (topic_id, status, notes) values ('test-f-t1', 'en_curso', 'mis notas') $$,
  'A puede crear su progreso de tema (user_id por defecto = auth.uid())'
);
select lives_ok(
  $$ insert into public.project_progress (phase_id, status, repo_url) values ('test-f', 'en_curso', 'https://github.com/diego/demo') $$,
  'A puede crear el progreso de su proyecto'
);
select lives_ok(
  $$ insert into public.checklist_progress (item_id, done) values ('test-c1', true) $$,
  'A puede marcar un ítem de la checklist'
);
select lives_ok(
  $$ insert into public.study_sessions (topic_id, started_at, ended_at, duration_minutes, mode)
     values ('test-f-t1', '2026-11-18 13:00+00', '2026-11-18 13:30+00', 25, 'pomodoro') $$,
  'A puede guardar una sesión'
);
select lives_ok(
  $$ insert into public.active_timer (topic_id, mode, started_at, work_min, break_min)
     values ('test-f-t1', 'pomodoro', now(), 25, 5) $$,
  'A puede guardar su temporizador activo'
);
select lives_ok(
  $$ insert into public.tutor_conversations (id, mode, topic_id)
     values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'quiz', 'test-f-t1') $$,
  'A puede crear una conversación con el tutor'
);
select lives_ok(
  $$ insert into public.tutor_messages (conversation_id, role, content)
     values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'user', '¿Qué es un webhook?') $$,
  'A puede escribir en su conversación'
);
select is(
  (select count(*) from public.user_settings), 1::bigint,
  'A solo ve su propia fila de user_settings'
);

-- ── Usuario B (otra cuenta) no ve ni toca los datos de A ─────────────────────
set local request.jwt.claims to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';

select is((select count(*) from public.topic_progress), 0::bigint, 'B no ve el progreso de temas de A');
select is((select count(*) from public.project_progress), 0::bigint, 'B no ve los proyectos de A');
select is((select count(*) from public.checklist_progress), 0::bigint, 'B no ve la checklist de A');
select is((select count(*) from public.study_sessions), 0::bigint, 'B no ve las sesiones de A');
select is((select count(*) from public.active_timer), 0::bigint, 'B no ve el temporizador de A');
select is((select count(*) from public.tutor_conversations), 0::bigint, 'B no ve las conversaciones de A');
select is((select count(*) from public.tutor_messages), 0::bigint, 'B no ve los mensajes de A');
select is(
  (select array_agg(user_id::text) from public.user_settings),
  array['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
  'B solo ve sus propios ajustes'
);

select throws_ok(
  $$ insert into public.topic_progress (user_id, topic_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test-f-t1') $$,
  '42501', null,
  'B no puede crear filas a nombre de A'
);
select throws_ok(
  $$ insert into public.tutor_messages (conversation_id, role, content)
     values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'user', 'intruso') $$,
  '23503', null,
  'B no puede escribir en la conversación de A'
);

-- Estos UPDATE/DELETE no fallan, pero RLS hace que no afecten ninguna fila de A.
update public.topic_progress set notes = 'modificado por B';
delete from public.study_sessions;
update public.user_settings set weekly_goal_minutes = 1 where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ── Contenido: solo lectura ──────────────────────────────────────────────────
select ok((select count(*) from public.phases where id = 'test-f') = 1, 'Un usuario autenticado lee las fases');
select throws_ok(
  $$ insert into public.phases (id, track_id, sort_order, title, estimated_weeks, project_title) values ('x', 'automatizacion', 1, 'x', 1, 'x') $$,
  '42501', null,
  'Un usuario autenticado no puede crear fases'
);
select throws_ok(
  $$ update public.topics set title = 'cambiado' $$,
  '42501', null,
  'Un usuario autenticado no puede editar temas'
);

-- ── De vuelta como A: sus datos siguen intactos ──────────────────────────────
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

select is((select notes from public.topic_progress where topic_id = 'test-f-t1'), 'mis notas', 'Las notas de A no cambiaron');
select is((select count(*) from public.study_sessions), 1::bigint, 'La sesión de A no se borró');
select is((select weekly_goal_minutes from public.user_settings), 600, 'La meta de A no cambió');

-- ── Triggers de completed_at / done_at ───────────────────────────────────────
update public.topic_progress set status = 'hecho' where topic_id = 'test-f-t1';
select ok((select completed_at is not null from public.topic_progress where topic_id = 'test-f-t1'), 'Al pasar a «hecho» se llena completed_at');
update public.topic_progress set status = 'en_curso' where topic_id = 'test-f-t1';
select ok((select completed_at is null from public.topic_progress where topic_id = 'test-f-t1'), 'Al salir de «hecho» se borra completed_at');
select ok((select done_at is not null from public.checklist_progress where item_id = 'test-c1'), 'Al marcar la checklist se llena done_at');

-- ── Restricciones ────────────────────────────────────────────────────────────
select throws_ok(
  $$ update public.topic_progress set status = 'listo' $$,
  '22P02', null,
  'status solo acepta pendiente / en_curso / hecho'
);
select throws_ok(
  $$ insert into public.study_sessions (topic_id, started_at, ended_at, duration_minutes, mode)
     values ('test-f-t1', '2026-11-18 14:00+00', '2026-11-18 14:30+00', 0, 'free') $$,
  '23514', null,
  'duration_minutes debe ser mayor que 0'
);
select throws_ok(
  $$ insert into public.study_sessions (topic_id, started_at, ended_at, duration_minutes, mode)
     values ('test-f-t1', '2026-11-18 14:00+00', '2026-11-18 14:00+00', 5, 'free') $$,
  '23514', null,
  'ended_at debe ser posterior a started_at'
);

-- ── anon (sin sesión) no accede a nada ───────────────────────────────────────
reset role;
set local role anon;
select throws_ok($$ select * from public.phases $$, '42501', null, 'Sin sesión no se pueden leer las fases');

select * from finish();
rollback;
