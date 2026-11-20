-- Pruebas de las funciones que guardan sesiones. Correr con: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(20);

insert into public.phases (id, sort_order, title, estimated_weeks, project_title)
values ('test-f', 99, 'Fase de prueba', 1, 'Proyecto de prueba');
insert into public.topics (id, phase_id, sort_order, title)
values ('test-f-t1', 'test-f', 0, 'Tema uno'), ('test-f-t2', 'test-f', 1, 'Tema dos');

insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'diego@pgtap.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'otra@pgtap.local', 'authenticated', 'authenticated');

set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

-- ── Terminar el temporizador activo ──────────────────────────────────────────
insert into public.active_timer (session_id, topic_id, mode, started_at, work_min, break_min)
values ('11111111-1111-1111-1111-111111111111', 'test-f-t1', 'pomodoro', '2026-11-19 13:00+00', 25, 5);

select is(
  public.finish_active_timer(
    '11111111-1111-1111-1111-111111111111', '2026-11-19 13:00+00', '2026-11-19 13:31+00', 25,
    'pomodoro', p_topic_id => 'test-f-t1', p_notes => 'Aprendí qué es un webhook'
  ),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'La sesión se guarda con el id del temporizador'
);
select results_eq(
  $$ select topic_id, started_at, ended_at, duration_minutes, mode::text, notes from public.study_sessions $$,
  $$ values ('test-f-t1'::text, '2026-11-19 13:00+00'::timestamptz, '2026-11-19 13:31+00'::timestamptz, 25, 'pomodoro'::text, 'Aprendí qué es un webhook'::text) $$,
  'La sesión guarda tema, inicio, fin, minutos, modo y notas'
);
select is((select count(*) from public.active_timer), 0::bigint, 'El temporizador se borra al terminar');
select is(
  (select status::text from public.topic_progress where topic_id = 'test-f-t1'), 'en_curso',
  'Un tema pendiente pasa a «en curso» con su primera sesión'
);

-- ── Sin duplicar ─────────────────────────────────────────────────────────────
select lives_ok(
  $$ select public.finish_active_timer(
       '11111111-1111-1111-1111-111111111111', '2026-11-19 13:00+00', '2026-11-19 13:31+00', 25,
       'pomodoro', p_topic_id => 'test-f-t1', p_mark_done => true) $$,
  'Repetir el envío (la cola reintenta, u otro dispositivo lo termina) no falla'
);
select is((select count(*) from public.study_sessions), 1::bigint, 'Y no crea una segunda sesión');
select is(
  (select status::text from public.topic_progress where topic_id = 'test-f-t1'), 'en_curso',
  'Un reintento no vuelve a cambiar el progreso'
);

-- ── Sin conexión: el temporizador nunca llegó a la base ──────────────────────
select is(
  public.finish_active_timer(
    '22222222-2222-2222-2222-222222222222', '2026-11-19 14:00+00', '2026-11-19 14:20+00', 20,
    'free', p_topic_id => 'test-f-t2'
  ),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Se puede terminar aunque el temporizador se empezara sin conexión'
);
select is((select count(*) from public.study_sessions), 2::bigint, 'La sesión queda guardada');

-- ── Sesión manual y «marcar como hecho» ──────────────────────────────────────
select lives_ok(
  $$ select public.record_study_session('2026-11-18 04:30+00', '2026-11-18 05:30+00', 60, 'manual',
       p_topic_id => 'test-f-t1', p_notes => 'Repaso', p_mark_done => true,
       p_id => '33333333-3333-3333-3333-333333333333') $$,
  'Se puede registrar una sesión manual con un id del dispositivo'
);
select lives_ok(
  $$ select public.record_study_session('2026-11-18 04:30+00', '2026-11-18 05:30+00', 60, 'manual',
       p_topic_id => 'test-f-t1', p_notes => 'Repaso', p_mark_done => true,
       p_id => '33333333-3333-3333-3333-333333333333') $$,
  'Reenviarla desde la cola no falla'
);
select is(
  (select count(*) from public.study_sessions where id = '33333333-3333-3333-3333-333333333333'),
  1::bigint,
  'Y queda una sola'
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
  $$ select public.record_study_session('2026-11-19 16:00+00', '2026-11-19 16:45+00', 45, 'manual', p_project_phase_id => 'test-f') $$,
  'Sin id del dispositivo también funciona (se genera uno)'
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

-- ── Otro usuario no toca el temporizador de A ────────────────────────────────
insert into public.active_timer (session_id, topic_id, mode, started_at, work_min, break_min)
values ('44444444-4444-4444-4444-444444444444', 'test-f-t2', 'free', '2026-11-19 18:00+00', 25, 5);

set local request.jwt.claims to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
select lives_ok(
  $$ select public.finish_active_timer(
       '44444444-4444-4444-4444-444444444444', '2026-11-19 18:00+00', '2026-11-19 18:30+00', 30,
       'free', p_topic_id => 'test-f-t2') $$,
  'B termina «su» temporizador con el id del de A'
);

set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
select is((select count(*) from public.active_timer), 1::bigint, 'El temporizador de A sigue intacto');

-- ── Sin sesión no se pueden llamar ───────────────────────────────────────────
reset role;
set local role anon;
select throws_ok(
  $$ select public.finish_active_timer(gen_random_uuid(), now(), now(), 10, 'free') $$,
  '42501', null,
  'anon no puede ejecutar finish_active_timer'
);

select * from finish();
rollback;
