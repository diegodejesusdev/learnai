-- Reglas de seguridad que debe cumplir toda migración (docs/SPEC.md §6). Correr con: npm run db:test
-- Si una tabla o función nueva olvida RLS o sus permisos, esta prueba falla en local
-- antes de llegar a la nube.
begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'Todas las tablas de public tienen RLS activa'
);

select is_empty(
  $$ select c.table_name
     from information_schema.columns c
     where c.table_schema = 'public' and c.column_name = 'user_id'
       and not exists (
         select 1 from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.table_name
           and p.qual like '%auth.uid()%' and p.with_check like '%auth.uid()%'
       ) $$,
  'Toda tabla con user_id tiene una política que la limita a auth.uid()'
);

select is_empty(
  $$ select table_name, privilege_type from information_schema.role_table_grants
     where grantee = 'anon' and table_schema = 'public' $$,
  'anon (sin sesión) no tiene permisos sobre ninguna tabla'
);

select is_empty(
  $$ select table_name, privilege_type from information_schema.role_table_grants
     where grantee = 'authenticated' and table_schema = 'public'
       and table_name in
         ('curriculum_meta', 'tracks', 'phases', 'topics', 'checklist_items', 'lessons')
       and privilege_type <> 'SELECT' $$,
  'El contenido de la ruta es de solo lectura para los usuarios'
);

select is_empty(
  $$ select p.proname from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.prorettype <> 'trigger'::regtype
       and has_function_privilege('anon', p.oid, 'execute') $$,
  'anon no puede ejecutar ninguna función (salvo los triggers, que no se llaman directo)'
);

select * from finish();
rollback;
