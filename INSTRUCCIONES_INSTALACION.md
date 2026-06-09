# 🚀 PREDIQUÉ - GUÍA DE INSTALACIÓN EN TU MAC

## 📥 PASO 1: DESCARGAR Y DESCOMPRIMIR

1. Descargá el archivo `predique.tar.gz`
2. Hacé doble click para descomprimir (o desde terminal):

```bash
tar -xzf predique.tar.gz
cd predique
```

---

## ⚙️ PASO 2: INSTALAR DEPENDENCIAS

Abrí Terminal y ejecutá:

```bash
npm install
```

Esto va a tardar 1-2 minutos instalando las librerías.

---

## 🔑 PASO 3: CONFIGURAR SUPABASE

### 3.1 Crear proyecto en Supabase
1. Andá a: https://supabase.com
2. Click en "Start your project"
3. Registrate con Google
4. Click en "New Project"
   - Organization: Create new organization → "Predique"
   - Project Name: `predique`
   - Database Password: Generá una y GUARDALA
   - Region: **South America (Sao Paulo)**
   - Click "Create new project"
5. Esperá 2-3 minutos a que se cree

### 3.2 Obtener credenciales
1. En tu proyecto de Supabase, andá a:
   - **Settings** (engranaje abajo izquierda) → **API**
2. Copiá estos dos valores:
   - `Project URL` (algo como https://xxxxx.supabase.co)
   - `anon public` key (el que dice "anon" "public")

### 3.3 Configurar variables de entorno
1. En la carpeta del proyecto, copiá el archivo de ejemplo:

```bash
cp .env.local.example .env.local
```

2. Abrí `.env.local` con tu editor favorito y pegá tus credenciales:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-aqui.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-super-larga-aqui
```

3. Guardá el archivo

### 3.4 Crear las tablas en Supabase
1. En Supabase, andá a: **SQL Editor**
2. Click en "New query"
3. Abrí el archivo `supabase-setup.sql` (está en la carpeta del proyecto)
4. Copiá TODO el contenido
5. Pegalo en el SQL Editor de Supabase
6. Click en **"Run"** (o presioná Cmd+Enter)
7. Deberías ver "Success. No rows returned"

---

## 🎯 PASO 4: EJECUTAR LA APP

```bash
npm run dev
```

Esperá unos segundos y deberías ver:

```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

**Abrí tu navegador en:** http://localhost:3000

---

## ✅ VERIFICAR QUE TODO FUNCIONA

Si ves la pantalla de Prediqué con:
- Header "Prediqué" con el logo
- Card de "Tu Progreso" con stats
- 3 predicciones de ejemplo (Cerro vs Olimpia, etc)

**¡PERFECTO! 🎉 La app está corriendo**

---

## 🛠️ COMANDOS ÚTILES

```bash
# Detener el servidor
Ctrl + C (en la terminal)

# Volver a arrancar
npm run dev

# Ver errores
npm run dev --verbose
```

---

## ❌ SI ALGO SALE MAL

### Error: "command not found: npm"
Necesitás instalar Node.js:
1. Andá a https://nodejs.org
2. Descargá la versión LTS
3. Instalá y reiniciá la Terminal

### Error: "Supabase URL is not defined"
1. Verificá que `.env.local` existe en la carpeta del proyecto
2. Verificá que las variables están completas (sin espacios extras)
3. Reiniciá el servidor (Ctrl+C y `npm run dev`)

### Error al ejecutar el SQL
1. Verificá que copiaste TODO el script
2. Verificá que estás en el SQL Editor correcto
3. Intentá ejecutar sección por sección

### La página se ve sin estilos
1. Detené el servidor (Ctrl+C)
2. Ejecutá: `rm -rf .next`
3. Volvé a ejecutar: `npm run dev`

---

## 📞 PRÓXIMO PASO

Una vez que la app esté corriendo:

1. Revisá el archivo `README.md` para ver la estructura completa
2. Revisá el plan en el documento Word para seguir el roadmap
3. Empezamos a agregar features paso a paso

---

**¿Listo para empezar a desarrollar? 🚀**

Cuando tengas todo corriendo, avisame y seguimos con el siguiente paso:
- Agregar autenticación con Google
- Crear el panel de admin para agregar predicciones
- Y mucho más...
