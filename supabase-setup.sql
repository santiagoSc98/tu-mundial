-- ======================================
-- PREDIQUÉ - Schema de Base de Datos
-- ======================================
-- Ejecutá este script completo en Supabase SQL Editor
-- Settings → SQL Editor → New Query → Pegar y Run

-- 1. TABLA DE PERFILES
-- Extiende auth.users con datos del juego
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  username text unique,
  avatar_url text,
  total_points integer default 0,
  current_streak integer default 0,
  is_premium boolean default false,
  premium_until timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Habilitar Row Level Security
alter table public.profiles enable row level security;

-- Policy: Los usuarios pueden ver todos los perfiles (necesario para rankings)
create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

-- Policy: Los usuarios pueden actualizar solo su propio perfil
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Policy: Los usuarios pueden insertar su propio perfil (fallback si el trigger falla)
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- 2. TABLA DE PREDICCIONES
-- Las preguntas/predicciones que los usuarios responden
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text not null,
  deadline timestamp with time zone not null,
  correct_answer text,
  difficulty_multiplier numeric default 1.0,
  status text default 'open' check (status in ('open', 'closed', 'resolved')),
  options jsonb,
  created_at timestamp with time zone default now()
);

alter table public.predictions enable row level security;

-- Policy: Todos pueden ver predicciones
create policy "Predictions are viewable by everyone"
  on predictions for select
  using (true);

-- 3. TABLA DE RESPUESTAS DE USUARIOS
-- Registra qué predijo cada usuario
create table public.user_predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  prediction_id uuid references public.predictions(id) on delete cascade not null,
  predicted_answer text not null,
  confidence_level integer default 50,
  points_earned integer,
  is_correct boolean,
  created_at timestamp with time zone default now(),
  unique(user_id, prediction_id)
);

alter table public.user_predictions enable row level security;

-- Policy: Los usuarios pueden ver sus propias predicciones
create policy "Users can view own predictions"
  on user_predictions for select
  using (auth.uid() = user_id);

-- Policy: Los usuarios pueden insertar sus propias predicciones
create policy "Users can insert own predictions"
  on user_predictions for insert
  with check (auth.uid() = user_id);

-- 4. FUNCIÓN AUTOMÁTICA PARA CREAR PERFIL
-- Cuando alguien se registra con Google, guarda también avatar y nombre
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, avatar_url, username)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- 5. TRIGGER PARA EJECUTAR LA FUNCIÓN
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ======================================
-- DATOS DE PRUEBA (Opcional)
-- ======================================
-- Descomentar para insertar predicciones de ejemplo

/*
insert into public.predictions (title, description, category, deadline, options, status) values
  (
    'Cerro Porteño vs Olimpia',
    '¿Quién ganará el clásico paraguayo?',
    'Fútbol',
    now() + interval '2 hours',
    '["Cerro", "Empate", "Olimpia"]'::jsonb,
    'open'
  ),
  (
    'Bitcoin vs USD',
    '¿Subirá o bajará el precio de BTC hoy?',
    'Crypto',
    now() + interval '8 hours',
    '["Sube", "Baja"]'::jsonb,
    'open'
  );
*/

-- ======================================
-- ✅ LISTO!
-- ======================================
-- Ahora podés usar la app con Supabase configurado
