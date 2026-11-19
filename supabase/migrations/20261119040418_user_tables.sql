-- Datos del usuario (docs/SPEC.md §5.2). Cada fila lleva user_id y RLS:
-- cada quien solo lee y escribe sus propias filas.

-- ── Tipos ────────────────────────────────────────────────────────────────────
create type public.progress_status as enum ('pendiente', 'en_curso', 'hecho');
create type public.study_mode as enum ('pomodoro', 'free', 'manual');
create type public.timer_mode as enum ('pomodoro', 'free');
create type public.tutor_mode as enum ('explain', 'quiz', 'project_review', 'daily_plan');
create type public.message_role as enum ('user', 'assistant');
create type public.theme_preference as enum ('system', 'light', 'dark');

-- ── Funciones de triggers ────────────────────────────────────────────────────
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- completed_at se llena al pasar a «hecho» y se borra al salir de ese estado.
create function public.set_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'hecho' then
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create function public.set_checklist_done_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.done then
    new.done_at := coalesce(new.done_at, now());
  else
    new.done_at := null;
  end if;
  return new;
end;
$$;

-- ── Progreso ─────────────────────────────────────────────────────────────────
-- Si un tema no tiene fila, se considera pendiente.
create table public.topic_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic_id text not null references public.topics (id) on update cascade on delete restrict,
  status public.progress_status not null default 'pendiente',
  notes text not null default '',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create index topic_progress_topic_id_idx on public.topic_progress (topic_id);

create table public.project_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  phase_id text not null references public.phases (id) on update cascade on delete restrict,
  status public.progress_status not null default 'pendiente',
  repo_url text,
  demo_url text,
  notes text not null default '',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, phase_id),
  constraint project_progress_repo_url_http check (repo_url is null or repo_url ~* '^https?://'),
  constraint project_progress_demo_url_http check (demo_url is null or demo_url ~* '^https?://')
);

create index project_progress_phase_id_idx on public.project_progress (phase_id);

create table public.checklist_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text not null references public.checklist_items (id) on update cascade on delete restrict,
  done boolean not null default false,
  done_at timestamptz,
  primary key (user_id, item_id)
);

create index checklist_progress_item_id_idx on public.checklist_progress (item_id);

-- ── Sesiones de estudio ──────────────────────────────────────────────────────
-- duration_minutes es tiempo neto (sin descansos ni pausas), por eso no se deriva de las horas.
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic_id text references public.topics (id) on update cascade on delete restrict,
  project_phase_id text references public.phases (id) on update cascade on delete restrict,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_minutes integer not null,
  mode public.study_mode not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_sessions_one_target check (num_nonnulls(topic_id, project_phase_id) = 1),
  constraint study_sessions_duration_positive check (duration_minutes > 0),
  constraint study_sessions_duration_max check (duration_minutes <= 720),
  constraint study_sessions_ended_after_started check (ended_at > started_at),
  constraint study_sessions_duration_fits check (
    duration_minutes <= ceil(extract(epoch from (ended_at - started_at)) / 60)
  )
);

create index study_sessions_user_started_idx on public.study_sessions (user_id, started_at desc);
create index study_sessions_topic_id_idx on public.study_sessions (topic_id);
create index study_sessions_project_phase_id_idx on public.study_sessions (project_phase_id);

-- Temporizador en curso: una fila por usuario, para verlo desde otro dispositivo.
create table public.active_timer (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  topic_id text references public.topics (id) on update cascade on delete restrict,
  project_phase_id text references public.phases (id) on update cascade on delete restrict,
  mode public.timer_mode not null,
  started_at timestamptz not null,
  paused_at timestamptz,
  paused_seconds integer not null default 0,
  work_min integer not null,
  break_min integer not null,
  updated_at timestamptz not null default now(),
  constraint active_timer_one_target check (num_nonnulls(topic_id, project_phase_id) = 1),
  constraint active_timer_paused_seconds_positive check (paused_seconds >= 0),
  constraint active_timer_paused_after_start check (paused_at is null or paused_at >= started_at),
  constraint active_timer_work_min_range check (work_min between 1 and 180),
  constraint active_timer_break_min_range check (break_min between 1 and 60)
);

create index active_timer_topic_id_idx on public.active_timer (topic_id);
create index active_timer_project_phase_id_idx on public.active_timer (project_phase_id);

-- ── Tutor ────────────────────────────────────────────────────────────────────
create table public.tutor_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mode public.tutor_mode not null,
  topic_id text references public.topics (id) on update cascade on delete restrict,
  phase_id text references public.phases (id) on update cascade on delete restrict,
  title text not null default 'Nueva conversación',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Permite que los mensajes referencien (conversación, usuario) y no la de otra persona.
  unique (id, user_id),
  constraint tutor_conversations_context check (
    (mode in ('explain', 'quiz') and topic_id is not null and phase_id is null)
    or (mode = 'project_review' and phase_id is not null and topic_id is null)
    or (mode = 'daily_plan' and topic_id is null and phase_id is null)
  )
);

create index tutor_conversations_user_updated_idx on public.tutor_conversations (user_id, updated_at desc);
create index tutor_conversations_topic_id_idx on public.tutor_conversations (topic_id);
create index tutor_conversations_phase_id_idx on public.tutor_conversations (phase_id);

create table public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role public.message_role not null,
  content text not null,
  model text,
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz not null default now(),
  foreign key (conversation_id, user_id)
    references public.tutor_conversations (id, user_id) on delete cascade,
  constraint tutor_messages_content_not_empty check (char_length(content) > 0),
  constraint tutor_messages_tokens_positive check (
    (tokens_in is null or tokens_in >= 0) and (tokens_out is null or tokens_out >= 0)
  )
);

create index tutor_messages_conversation_created_idx on public.tutor_messages (conversation_id, created_at);
create index tutor_messages_user_id_idx on public.tutor_messages (user_id);

-- ── Ajustes ──────────────────────────────────────────────────────────────────
create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  weekly_goal_minutes integer not null default 600,
  pomodoro_work_min integer not null default 25,
  pomodoro_break_min integer not null default 5,
  theme public.theme_preference not null default 'system',
  updated_at timestamptz not null default now(),
  constraint user_settings_weekly_goal_range check (weekly_goal_minutes between 0 and 10080),
  constraint user_settings_work_min_range check (pomodoro_work_min between 1 and 180),
  constraint user_settings_break_min_range check (pomodoro_break_min between 1 and 60)
);

-- ── Triggers ─────────────────────────────────────────────────────────────────
create trigger set_updated_at before update on public.topic_progress
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.project_progress
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.study_sessions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.active_timer
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tutor_conversations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();

create trigger set_completed_at before insert or update of status on public.topic_progress
  for each row execute function public.set_completed_at();
create trigger set_completed_at before insert or update of status on public.project_progress
  for each row execute function public.set_completed_at();
create trigger set_done_at before insert or update of done on public.checklist_progress
  for each row execute function public.set_checklist_done_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.topic_progress enable row level security;
alter table public.project_progress enable row level security;
alter table public.checklist_progress enable row level security;
alter table public.study_sessions enable row level security;
alter table public.active_timer enable row level security;
alter table public.tutor_conversations enable row level security;
alter table public.tutor_messages enable row level security;
alter table public.user_settings enable row level security;

create policy "Cada usuario gestiona sus filas" on public.topic_progress
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Cada usuario gestiona sus filas" on public.project_progress
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Cada usuario gestiona sus filas" on public.checklist_progress
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Cada usuario gestiona sus filas" on public.study_sessions
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Cada usuario gestiona sus filas" on public.active_timer
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Cada usuario gestiona sus filas" on public.tutor_conversations
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Cada usuario gestiona sus filas" on public.tutor_messages
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Cada usuario gestiona sus filas" on public.user_settings
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Permisos explícitos: anon no accede; authenticated opera (filtrado por RLS).
revoke all on
  public.topic_progress, public.project_progress, public.checklist_progress,
  public.study_sessions, public.active_timer, public.tutor_conversations,
  public.tutor_messages, public.user_settings
  from anon, authenticated;
grant select, insert, update, delete on
  public.topic_progress, public.project_progress, public.checklist_progress,
  public.study_sessions, public.active_timer, public.tutor_conversations,
  public.tutor_messages, public.user_settings
  to authenticated, service_role;

-- ── Ajustes por defecto al registrarse ───────────────────────────────────────
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Solo la ejecuta el trigger; nadie la puede llamar por la API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuarios que ya existían antes de esta migración (p. ej. si entraste antes de aplicarla).
insert into public.user_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;
