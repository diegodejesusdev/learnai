-- Pruebas de los totales del Historial (días y semanas de Bogotá). Correr con: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

insert into public.phases (id, track_id, sort_order, title, estimated_weeks, project_title)
values ('test-f', 'automatizacion', 99, 'Fase de prueba', 1, 'Proyecto de prueba');
insert into public.topics (id, phase_id, sort_order, title)
values ('test-f-t1', 'test-f', 0, 'Tema uno'), ('test-f-t2', 'test-f', 1, 'Tema dos');

insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'diego@pgtap.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'otra@pgtap.local', 'authenticated', 'authenticated');

set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

-- Bogotá = UTC−5. Las horas de los comentarios son de Bogotá.
insert into public.study_sessions (topic_id, project_phase_id, started_at, ended_at, duration_minutes, mode)
values
  -- Domingo 15, 23:30 → 23:55 (en UTC ya es lunes 16)
  ('test-f-t1', null, '2026-11-16 04:30+00', '2026-11-16 04:55+00', 25, 'manual'),
  -- Lunes 16, 00:30 → 01:00
  ('test-f-t2', null, '2026-11-16 05:30+00', '2026-11-16 06:00+00', 30, 'free'),
  -- Martes 17, 23:40 → miércoles 18, 00:25: cruza la medianoche
  ('test-f-t1', null, '2026-11-18 04:40+00', '2026-11-18 05:25+00', 45, 'pomodoro'),
  -- Miércoles 18, 08:00 y 17:00 (la segunda, en el proyecto de la fase)
  ('test-f-t2', null, '2026-11-18 13:00+00', '2026-11-18 13:20+00', 20, 'free'),
  (null, 'test-f', '2026-11-18 22:00+00', '2026-11-18 22:30+00', 30, 'manual');

-- ── Totales por día ──────────────────────────────────────────────────────────
select results_eq(
  $$ select day, minutes, sessions from public.study_day_totals() $$,
  $$ values ('2026-11-15'::date, 25, 1), ('2026-11-16'::date, 30, 1),
            ('2026-11-17'::date, 45, 1), ('2026-11-18'::date, 50, 2) $$,
  'Los minutos se agrupan por día de Bogotá, no de UTC'
);
select is(
  (select minutes from public.study_day_totals() where day = '2026-11-17'), 45,
  'Una sesión que cruza la medianoche cuenta entera en el día en que empezó'
);
select results_eq(
  $$ select day, minutes from public.study_day_totals('2026-11-16', '2026-11-17') $$,
  $$ values ('2026-11-16'::date, 30), ('2026-11-17'::date, 45) $$,
  'p_from y p_to son días de Bogotá y ambos se incluyen'
);

-- ── Totales por semana (lunes a domingo) ─────────────────────────────────────
select results_eq(
  $$ select week_start, minutes, sessions from public.study_week_totals() $$,
  $$ values ('2026-11-09'::date, 25, 1), ('2026-11-16'::date, 125, 4) $$,
  'Las semanas empiezan el lunes en hora de Bogotá'
);
select is(
  (select minutes from public.study_week_totals() where week_start = '2026-11-09'), 25,
  'El domingo a las 23:30 (lunes 04:30 en UTC) cuenta en la semana anterior'
);
select results_eq(
  $$ select week_start, minutes from public.study_week_totals('2026-11-16') $$,
  $$ values ('2026-11-16'::date, 125) $$,
  'p_from deja fuera las semanas anteriores'
);

-- ── Totales por fase ─────────────────────────────────────────────────────────
select results_eq(
  $$ select phase_id, minutes, sessions from public.study_phase_totals() $$,
  $$ values ('test-f'::text, 150, 5) $$,
  'Las sesiones de temas y del proyecto suman a su fase'
);

-- ── Mínimo diario para la racha ──────────────────────────────────────────────
select is(
  (select streak_min_minutes from public.user_settings), 15,
  'Por defecto, un día cuenta para la racha desde 15 minutos'
);
select throws_ok(
  $$ update public.user_settings set streak_min_minutes = 0 $$,
  '23514', null,
  'El mínimo para la racha no puede ser 0'
);
select lives_ok(
  $$ update public.user_settings set streak_min_minutes = 30 $$,
  'Se puede cambiar el mínimo para la racha'
);

-- ── Cada usuario solo ve sus totales ─────────────────────────────────────────
set local request.jwt.claims to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
select is_empty($$ select * from public.study_day_totals() $$, 'B no ve los días de A');
select is_empty($$ select * from public.study_week_totals() $$, 'B no ve las semanas de A');
select is_empty($$ select * from public.study_phase_totals() $$, 'B no ve las fases de A');

-- ── Sin sesión no se pueden llamar ───────────────────────────────────────────
reset role;
set local role anon;
select throws_ok(
  $$ select * from public.study_day_totals() $$, '42501', null,
  'anon no puede ejecutar study_day_totals'
);
select throws_ok(
  $$ select * from public.study_week_totals() $$, '42501', null,
  'anon no puede ejecutar study_week_totals'
);
select throws_ok(
  $$ select * from public.study_phase_totals() $$, '42501', null,
  'anon no puede ejecutar study_phase_totals'
);

select * from finish();
rollback;
