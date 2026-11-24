-- Pruebas del tutor: resultados de quiz y notas desde el tutor. Correr con: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into public.phases (id, track_id, sort_order, title, estimated_weeks, project_title)
values ('test-f', 'automatizacion', 99, 'Fase de prueba', 1, 'Proyecto de prueba');
insert into public.topics (id, phase_id, sort_order, title)
values ('test-f-t1', 'test-f', 0, 'Tema uno');

insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'diego@pgtap.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'otra@pgtap.local', 'authenticated', 'authenticated');

set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

insert into public.tutor_conversations (id, mode, topic_id, title)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'quiz', 'test-f-t1', 'Quiz: Tema uno');
insert into public.tutor_messages (id, conversation_id, role, content)
values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'assistant', '{"questions":[]}'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'assistant', '{"questions":[]}');

-- ── Resultados de quiz ───────────────────────────────────────────────────────
select lives_ok(
  $$ insert into public.quiz_results (message_id, topic_id, score, total, answers)
     values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'test-f-t1', 4, 5, '{0,1,2,3,0}') $$,
  'Se guarda el resultado de un quiz'
);
select lives_ok(
  $$ insert into public.quiz_results (message_id, topic_id, score, total, answers)
     values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'test-f-t1', 5, 5, '{0,1,2,3,1}')
     on conflict (message_id) do update set score = excluded.score, answers = excluded.answers $$,
  'Repetir el quiz reemplaza el resultado'
);
select is((select score from public.quiz_results), 5, 'Queda el último resultado');
select throws_ok(
  $$ insert into public.quiz_results (message_id, topic_id, score, total, answers)
     values (gen_random_uuid(), 'test-f-t1', 6, 5, '{0,0,0,0,0}') $$,
  '23514', null,
  'El puntaje no puede pasar del total'
);
select throws_ok(
  $$ update public.quiz_results set answers = '{0,1}' $$,
  '23514', null,
  'Debe haber una respuesta por pregunta'
);

-- ── Notas desde el tutor ─────────────────────────────────────────────────────
select lives_ok(
  $$ select public.append_topic_notes('test-f-t1', 'Primer fragmento') $$,
  'Crea la fila del tema si no existía'
);
select lives_ok(
  $$ select public.append_topic_notes('test-f-t1', 'Segundo fragmento') $$,
  'Agrega al final de las notas'
);
select is(
  (select notes from public.topic_progress where topic_id = 'test-f-t1'),
  E'Primer fragmento\n\nSegundo fragmento',
  'Los fragmentos quedan separados por una línea en blanco'
);
select is(
  (select status::text from public.topic_progress where topic_id = 'test-f-t1'), 'pendiente',
  'Guardar notas no cambia el estado del tema'
);
select lives_ok(
  $$ select public.append_project_notes('test-f', 'Revisión del tutor') $$,
  'También en las notas del proyecto'
);

-- ── B no ve ni usa lo de A ───────────────────────────────────────────────────
set local request.jwt.claims to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
select is_empty($$ select * from public.quiz_results $$, 'B no ve los resultados de A');
select throws_ok(
  $$ insert into public.quiz_results (message_id, topic_id, score, total, answers)
     values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'test-f-t1', 1, 1, '{0}') $$,
  '23503', null,
  'B no puede guardar un resultado sobre un mensaje de A'
);
select public.append_topic_notes('test-f-t1', 'Nota de B');
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
select is(
  (select notes from public.topic_progress where topic_id = 'test-f-t1'),
  E'Primer fragmento\n\nSegundo fragmento',
  'Las notas de B van a su propia fila, no a la de A'
);

-- ── Sin sesión ───────────────────────────────────────────────────────────────
reset role;
set local role anon;
select throws_ok(
  $$ select public.append_topic_notes('test-f-t1', 'x') $$, '42501', null,
  'anon no puede guardar notas'
);

select * from finish();
rollback;
