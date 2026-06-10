Tu mundial

##  INSTALACIÓN RÁPIDA (3 pasos)

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Configurar variables de entorno
1. Copiá `.env.local.example` y renombralo a `.env.local`
2. Pegá tus credenciales de Supabase (ver abajo)

```bash
cp .env.local.example .env.local
```

Editá `.env.local` y reemplazá con tus valores:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### Paso 3: Ejecutar la app
```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador 🚀

---

##  CONFIGURACIÓN DE SUPABASE

### 1. Crear proyecto en Supabase
- Andá a https://supabase.com
- Creá un nuevo proyecto
- Esperá 2-3 minutos a que se cree

### 2. Obtener credenciales
- Settings → API
- Copiá:
  - `Project URL` → va en `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Crear las tablas
Andá a SQL Editor en Supabase y ejecutá este script:

```sql
-- Crear tabla de perfiles (extiende auth.users)
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

-- Policy: Los usuarios pueden ver todos los perfiles (para rankings)
create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

-- Policy: Los usuarios pueden actualizar solo su propio perfil
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Crear tabla de predicciones
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

-- Policy: Todos pueden ver predicciones abiertas
create policy "Predictions are viewable by everyone"
  on predictions for select
  using (true);

-- Crear tabla de predicciones de usuarios
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

-- Función para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para ejecutar la función
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

##  ESTRUCTURA DEL PROYECTO

```
predique/
├── app/
│   ├── page.tsx          # Página principal (feed de predicciones)
│   ├── layout.tsx        # Layout general
│   └── globals.css       # Estilos globales
├── components/
│   └── ui/               # Componentes de shadcn/ui
│       ├── button.tsx
│       ├── card.tsx
│       └── badge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts     # Cliente Supabase (navegador)
│   │   └── server.ts     # Cliente Supabase (servidor)
│   ├── database.types.ts # Tipos de TypeScript
│   └── utils.ts          # Utilidades
└── .env.local            # Variables de entorno (NO COMMITEAR)
```

---

##  PRÓXIMOS PASOS

### Semana 1 (Fundamentos)
- [x] Setup inicial del proyecto
- [ ] Auth con Google
- [ ] Crear predicciones desde admin
- [ ] UI para hacer predicciones

### Semana 2 (Core)
- [ ] Sistema de puntos
- [ ] Resolver predicciones
- [ ] Cálculo de puntos ganados

### Semana 3 (Social)
- [ ] Ranking global
- [ ] Sistema de rachas
- [ ] Ligas privadas

### Semana 4 (Launch)
- [ ] PWA setup
- [ ] Notificaciones
- [ ] Beta testing

---

## 📱 COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Ejecutar versión de producción
npm start

# Linting
npm run lint
```

---

##  TROUBLESHOOTING

### Error: "Supabase URL is not defined"
- Verificá que el archivo `.env.local` existe
- Verificá que las variables están bien escritas
- Reiniciá el servidor (`npm run dev`)

### Error: "Cannot find module '@/components/ui/card'"
- Ejecutá: `npm install`
- Verificá que la carpeta `components/ui` exists

### La app se ve mal / sin estilos
- Verificá que Tailwind está configurado
- Revisá `tailwind.config.ts` y `app/globals.css`

---

##  CONTACTO

Si tenés problemas, revisá:
1. El documento Word con el plan completo
2. La documentación de Next.js: https://nextjs.org/docs
3. La documentación de Supabase: https://supabase.com/docs

---
# tu-mundial
