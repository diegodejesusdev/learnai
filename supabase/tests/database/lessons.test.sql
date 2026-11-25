-- Pruebas de las lecciones y de lo leído. Correr con: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'diego@pgtap.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'otra@pgtap.local', 'authenticated', 'authenticated');
insert into public.tracks (id, sort_order, title, goal)
values ('test-ruta', 98, 'Ruta de prueba', 'Meta');
insert into public.phases (id, track_id, sort_order, title, estimated_weeks, project_title)
values ('test-f', 'test-ruta', 0, 'Fase de prueba', 1, 'Proyecto de prueba');
insert into public.topics (id, phase_id, sort_order, title)
values ('test-f-t1', 'test-f', 0, 'Con lección'), ('test-f-t2', 'test-f', 1, 'Sin lección');

-- ── Una lección por tema, y solo de temas que existen ────────────────────────
select lives_ok(
  $$ insert into public.lessons (topic_id, content_md, minutes, updated, content_hash)
     values ('test-f-t1', '## Objetivo', 25, '2026-11-24', 'abc') $$,
  'El seed guarda la lección de un tema'
);
select throws_ok(
  $$ insert into public.lessons (topic_id, content_md, minutes, updated, content_hash)
     values ('no-existe', '## Objetivo', 25, '2026-11-24', 'abc') $$,
  '23503', null,
  'Una lección de un tema que no existe no se guarda'
);
select throws_ok(
  $$ insert into public.lessons (topic_id, content_md, minutes, updated, content_hash)
     values ('test-f-t1', 'otra', 25, '2026-11-24', 'abc') $$,
  '23505', null,
  'Un tema tiene una sola lección'
);
select throws_ok(
  $$ update public.lessons set minutes = 0 where topic_id = 'test-f-t1' $$,
  '23514', null,
  'Los minutos deben ser mayores que 0'
);

-- ── Contenido: solo lectura para los usuarios ────────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

select is(
  (select content_md from public.lessons where topic_id = 'test-f-t1'), '## Objetivo',
  'Un usuario autenticado lee las lecciones'
);
select throws_ok(
  $$ insert into public.lessons (topic_id, content_md, minutes, updated, content_hash)
     values ('test-f-t2', 'x', 1, '2026-11-24', 'x') $$,
  '42501', null,
  'Un usuario autenticado no puede crear lecciones'
);
select throws_ok(
  $$ update public.lessons set content_md = 'cambiada' $$,
  '42501', null,
  'Un usuario autenticado no puede editar lecciones'
);
select throws_ok(
  $$ delete from public.lessons $$,
  '42501', null,
  'Un usuario autenticado no puede borrar lecciones'
);

-- ── Lo leído ─────────────────────────────────────────────────────────────────
select lives_ok(
  $$ select public.save_lesson_progress('test-f-t1', 40) $$,
  'A guarda hasta dónde leyó'
);
select results_eq(
  $$ select scroll_pct::integer, read_at from public.lesson_progress $$,
  $$ values (40, null::timestamptz) $$,
  'Va en 40 % y aún no está leída'
);
select public.save_lesson_progress('test-f-t1', 20);
select is(
  (select scroll_pct::integer from public.lesson_progress), 40,
  'Volver a subir en la página no baja el porcentaje'
);
select public.save_lesson_progress('test-f-t1', 100, '2026-11-24 15:00+00');
select results_eq(
  $$ select scroll_pct::integer, read_at from public.lesson_progress $$,
  $$ values (100, '2026-11-24 15:00+00'::timestamptz) $$,
  'Al llegar al final queda leída'
);
select public.save_lesson_progress('test-f-t1', 100, '2026-11-25 15:00+00');
select public.save_lesson_progress('test-f-t1', 50);
select results_eq(
  $$ select scroll_pct::integer, read_at from public.lesson_progress $$,
  $$ values (100, '2026-11-24 15:00+00'::timestamptz) $$,
  'Leerla otra vez (o subir la cola tarde) conserva la primera fecha'
);
select lives_ok(
  $$ select public.save_lesson_progress('test-f-t2', 10) $$,
  'No hace falta que la lección exista: el progreso va ligado al tema'
);
select throws_ok(
  $$ select public.save_lesson_progress('no-existe', 10) $$,
  '23503', null,
  'El tema debe existir'
);
select throws_ok(
  $$ select public.save_lesson_progress('test-f-t1', 101) $$,
  '23514', null,
  'El porcentaje va de 0 a 100'
);

-- ── B no ve ni cambia lo de A ────────────────────────────────────────────────
set local request.jwt.claims to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
select is((select count(*) from public.lesson_progress), 0::bigint, 'B no ve lo que leyó A');
select throws_ok(
  $$ insert into public.lesson_progress (user_id, topic_id)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test-f-t2') $$,
  '42501', null,
  'B no puede guardar progreso a nombre de A'
);
select public.save_lesson_progress('test-f-t1', 5);
delete from public.lesson_progress where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

reset role;
select results_eq(
  $$ select scroll_pct::integer from public.lesson_progress
     where topic_id = 'test-f-t1' order by user_id $$,
  $$ values (100), (5) $$,
  'Cada quien tiene su propio progreso'
);

-- ── Quitar una lección no borra lo que leíste ────────────────────────────────
delete from public.lessons where topic_id = 'test-f-t1';
select is(
  (select count(*) from public.lesson_progress where topic_id = 'test-f-t1'), 2::bigint,
  'Si se quita una lección, se conserva lo leído'
);

set local role anon;
select throws_ok($$ select * from public.lessons $$, '42501', null, 'Sin sesión no se leen las lecciones');
select throws_ok(
  $$ select public.save_lesson_progress('test-f-t1', 10) $$, '42501', null,
  'Sin sesión no se guarda progreso'
);

select * from finish();
rollback;
