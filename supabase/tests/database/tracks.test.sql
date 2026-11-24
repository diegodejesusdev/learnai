-- Pruebas de las rutas de estudio (tracks). Correr con: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'diego@pgtap.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'otra@pgtap.local', 'authenticated', 'authenticated');

-- ── La ruta que ya existía ───────────────────────────────────────────────────
select is(
  (select sort_order from public.tracks where id = 'automatizacion'), 1,
  'La migración crea la ruta de automatización como la primera'
);
select is_empty(
  $$ select id from public.phases where id ~ '^f[0-9]+$' and track_id <> 'automatizacion' $$,
  'Las fases f0…f8 son de automatización'
);
select is_empty(
  $$ select id from public.checklist_items where id ~ '^c[0-9]+$' and track_id <> 'automatizacion' $$,
  'Los ítems c1…c14 son de automatización'
);

-- ── Toda fase e ítem pertenece a una ruta que existe ─────────────────────────
insert into public.tracks (id, sort_order, title, goal)
values ('test-ruta', 98, 'Ruta de prueba', 'Meta'), ('test-vacia', 99, 'Ruta vacía', '');
insert into public.phases (id, track_id, sort_order, title, estimated_weeks, project_title)
values ('test-f', 'test-ruta', 0, 'Fase de prueba', 1, 'Proyecto de prueba');

select throws_ok(
  $$ insert into public.phases (id, sort_order, title, estimated_weeks, project_title)
     values ('test-sin-ruta', 0, 'Fase', 1, 'Proyecto') $$,
  '23502', null,
  'Una fase sin ruta no se guarda'
);
select throws_ok(
  $$ insert into public.phases (id, track_id, sort_order, title, estimated_weeks, project_title)
     values ('test-otra', 'no-existe', 0, 'Fase', 1, 'Proyecto') $$,
  '23503', null,
  'Una fase de una ruta que no existe no se guarda'
);
select throws_ok(
  $$ insert into public.checklist_items (id, sort_order, text) values ('test-c', 0, 'Ítem') $$,
  '23502', null,
  'Un ítem de checklist sin ruta no se guarda'
);
select throws_ok(
  $$ delete from public.tracks where id = 'test-ruta' $$,
  '23503', null,
  'Una ruta con fases no se puede borrar'
);

-- ── Ruta activa ──────────────────────────────────────────────────────────────
select is(
  (select active_track_id from public.user_settings
   where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  null,
  'Al registrarse no hay ruta activa (la app usa la primera)'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

select lives_ok(
  $$ insert into public.user_settings (active_track_id) values ('test-vacia')
     on conflict (user_id) do update set active_track_id = excluded.active_track_id $$,
  'A guarda su ruta activa'
);
select throws_ok(
  $$ update public.user_settings set active_track_id = 'no-existe' $$,
  '23503', null,
  'La ruta activa debe existir'
);

-- ── Contenido: solo lectura ──────────────────────────────────────────────────
select ok(
  (select count(*) from public.tracks where id = 'test-ruta') = 1,
  'Un usuario autenticado lee las rutas'
);
select throws_ok(
  $$ insert into public.tracks (id, sort_order, title, goal) values ('x', 1, 'x', 'x') $$,
  '42501', null,
  'Un usuario autenticado no puede crear rutas'
);
select throws_ok(
  $$ update public.tracks set title = 'cambiada' $$,
  '42501', null,
  'Un usuario autenticado no puede editar rutas'
);

-- ── B no ve ni cambia la ruta activa de A ────────────────────────────────────
set local request.jwt.claims to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
select is_empty(
  $$ select active_track_id from public.user_settings where active_track_id is not null $$,
  'B no ve la ruta activa de A'
);
update public.user_settings set active_track_id = 'automatizacion'
where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

reset role;
select is(
  (select active_track_id from public.user_settings
   where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'test-vacia',
  'La ruta activa de A no cambió'
);

-- ── Borrar una ruta vacía no borra los ajustes ───────────────────────────────
delete from public.tracks where id = 'test-vacia';
select results_eq(
  $$ select active_track_id, weekly_goal_minutes from public.user_settings
     where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  $$ values (null::text, 600) $$,
  'Si se borra la ruta activa, queda sin ruta activa y conserva los demás ajustes'
);

set local role anon;
select throws_ok($$ select * from public.tracks $$, '42501', null, 'Sin sesión no se leen las rutas');

select * from finish();
rollback;
