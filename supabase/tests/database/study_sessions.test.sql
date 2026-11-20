-- Pruebas de las funciones que guardan sesiones. Correr con: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

insert into public.phases (id, sort_order, title, estimated_weeks, project_title)
values ('test-f', 99, 'Fase de prueba', 1, 'Proyecto de prueba');
insert into public.topics (id, phase_id, sort_order, title)
values ('test-f-t1', 'test-f', 0, 'Tema uno'), ('test-f-t2', 'test-f', 1, 'Tema dos');

insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'diego@prueba.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'otra@prueba.local', 'authenticated', 'authenticated');

set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

-- ── Terminar el temporizador activo ──────────────────────────────────────────
insert into public.active_timer (topic_id, mode, started_at, work_min, break_min)
values ('test-f-t1', 'pomodoro', '2026-11-19 13:00+00', 25, 5);

select isnt(
  public.finish_active_timer('2026-11-19 13:31+00', 25, 'Aprendí qué es un webhook'),
  null,
  'finish_active_timer devuelve el id de la sesión'
);
select results_eq(
  $$ select topic_id, started_at, ended_at, duration_minutes, mode::text, notes from public.study_sessions $$,
  $$ values ('test-f-t1'::text, '2026-11-19 13:00+00'::timestamptz, '2026-11-19 13:31+00'::timestamptz, 25, 'pomodoro'::text, 'Aprendí qué es un webhook'::text) $$,
  'La sesión toma tema, inicio y modo del temporizador'
);
select is((select count(*) from public.active_timer), 0::bigint, 'El temporizador se borra al terminar');
select is(
  (select status::text from public.topic_progress where topic_id = 'test-f-t1'), 'en_curso',
  'Un tema pendiente pasa a «en curso» con su primera sesión'
);
select throws_ok(
  $$ select public.finish_active_timer('2026-11-19 14:00+00', 10) $$,
  'P0002', 'No hay un temporizador activo',
  'Sin temporizador activo no se guarda nada (evita guardar dos veces)'
);

-- ── Sesión manual y «marcar como hecho» ──────────────────────────────────────
select lives_ok(
  $$ select public.record_study_session('2026-11-18 04:30+00', '2026-11-18 05:30+00', 60, 'manual', p_topic_id => 'test-f-t1', p_notes => 'Repaso', p_mark_done => true) $$,
  'Se puede registrar una sesión manual'
);
select is(
  (select status::text from public.topic_progress where topic_id = 'test-f-t1'), 'hecho',
  'p_mark_done = true marca el tema como «hecho»'
);
select ok(
  (select completed_at is not null from public.topic_progress where topic_id = 'test-f-t1'),
  'El trigger llena completed_at al marcar «hecho»'
);
select lives_ok(
  $$ select public.record_study_session('2026-11-19 15:00+00', '2026-11-19 15:20+00', 20, 'free', p_topic_id => 'test-f-t1') $$,
  'Otra sesión en un tema ya hecho'
);
select is(
  (select status::text from public.topic_progress where topic_id = 'test-f-t1'), 'hecho',
  'Sin marcar, un tema «hecho» no retrocede a «en curso»'
);
select lives_ok(
  $$ select public.record_study_session('2026-11-19 16:00+00', '2026-11-19 16:45+00', 45, 'manual', p_project_phase_id => 'test-f') $$,
  'Se puede registrar tiempo en el proyecto de la fase'
);
select is(
  (select status::text from public.project_progress where phase_id = 'test-f'), 'en_curso',
  'El proyecto pendiente pasa a «en curso»'
);
select throws_ok(
  $$ select public.record_study_session('2026-11-19 17:00+00', '2026-11-19 17:00+00', 5, 'manual', p_topic_id => 'test-f-t2') $$,
  '23514', null,
  'Las restricciones de study_sessions siguen aplicando (ended_at > started_at)'
);

-- ── Otro usuario no puede terminar el temporizador de A ──────────────────────
insert into public.active_timer (topic_id, mode, started_at, work_min, break_min)
values ('test-f-t2', 'free', '2026-11-19 18:00+00', 25, 5);

set local request.jwt.claims to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
select throws_ok(
  $$ select public.finish_active_timer('2026-11-19 18:30+00', 30) $$,
  'P0002', null,
  'B no ve ni puede terminar el temporizador de A'
);

set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
select is((select count(*) from public.active_timer), 1::bigint, 'El temporizador de A sigue intacto');

-- ── Sin sesión no se pueden llamar ───────────────────────────────────────────
reset role;
set local role anon;
select throws_ok(
  $$ select public.finish_active_timer(now(), 10) $$,
  '42501', null,
  'anon no puede ejecutar finish_active_timer'
);

select * from finish();
rollback;
