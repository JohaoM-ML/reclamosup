# Supabase + Prisma — ReclamoUP

## 1. Crear proyecto Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto.
2. Guarda la contraseña de la base de datos.

## 2. Obtener connection strings

En **Project Settings → Database → Connection string**:

| Variable | Modo | Puerto | Uso |
|----------|------|--------|-----|
| `DATABASE_URL` | Transaction pooler | **6543** | App Next.js (runtime) |
| `DIRECT_URL` | Session / Direct | **5432** | Migraciones, seed, Prisma Studio |

Copia `.env.example` a `.env` y pega tus URLs:

```bash
cp .env.example .env
```

Ejemplo (reemplaza valores reales):

```env
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
SESSION_SECRET="tu-secreto-jwt"
```

## 3. Instalar y preparar la BD

```bash
cd reclamoup
npm install
npx prisma generate
npm run db:deploy    # aplica migraciones en Supabase
npm run db:seed      # carga datos demo
npm run dev
```

## 4. Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run db:migrate` | Nueva migración en desarrollo |
| `npm run db:deploy` | Aplicar migraciones (producción/Supabase) |
| `npm run db:push` | Sincronizar schema sin migración (solo dev) |
| `npm run db:seed` | Datos demo |
| `npm run db:studio` | UI visual (usa DIRECT_URL vía prisma.config) |
| `npm run db:reset` | ⚠ Borra todo y re-migra + seed |

## 5. Deploy (Vercel)

En Vercel → Environment Variables, agrega:

- `DATABASE_URL` (pooler 6543)
- `DIRECT_URL` (5432) — solo si corres migraciones en CI
- `SESSION_SECRET`

**PDFs escaneados:** siguen en carpeta `uploads/` local. En producción considera Supabase Storage o S3 (no incluido aún).

## 6. Esquema

Definido en `prisma/schema.prisma`. Tablas: User, Curso, Matricula, Evaluacion, Reclamo, ReclamoEvento, Notificacion.

## Credenciales demo (tras seed)

Password: `demo123`

- Estudiante: `ana@demo.up.edu.pe`
- Docente: `proleon@demo.up.edu.pe`
- DAAR: `daar@demo.up.edu.pe`
