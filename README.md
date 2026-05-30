# reclamosup

Sistema de reclamos de evaluaciones para DAAR Pregrado — Hackathon 2026.

## Flujo (2 pasos en CAP)

1. **Estudiante** (`ana@demo.up.edu.pe`) → **Nuevo reclamo (CAP)** → elige curso → llena formulario
2. **DAAR** (`daar@demo.up.edu.pe`) → **Escaneo CAP** → escanea el examen físico → confirma
3. **Docente** → resuelve en bandeja
4. **DAAR** → Dashboard → **Cerrar** → estudiante ve estado **Concluido**

## Cursos demo de Ana García

| Curso | Docente |
|-------|---------|
| Matemáticas 1 | Daniel Proleon |
| Economía General 1 | Carlos Parodi |
| Lenguaje 1 | Elio Sánchez |
| Introducción a la Ingeniería | Mario Chong |
| Fundamentos de Contabilidad | Mario Yañez |

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
cd reclamoup
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Usuarios demo (contraseña: `demo123`)

| Rol | Email |
|-----|-------|
| Estudiante | ana@demo.up.edu.pe |
| Docente | lopez@demo.up.edu.pe |
| DAAR | daar@demo.up.edu.pe |

## Demo rápida

1. Login **daar@demo.up.edu.pe** → Recepción CAP → seleccionar Ana → Parcial 1 → subir PDF → registrar.
2. Login **lopez@demo.up.edu.pe** → Tomar caso → resolver procedente con nota 14.
3. Login **daar@demo.up.edu.pe** → Dashboard → Cerrar.
4. Login **ana@demo.up.edu.pe** → ver reclamo cerrado y timeline.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma + SQLite (local, sin configuración externa)
- Tailwind CSS
- Server Actions

## Estructura

```
app/           → páginas y server actions
components/    → UI por rol
lib/services/  → lógica de negocio (validaciones, reclamos, archivos)
prisma/        → schema y seed
uploads/       → PDFs escaneados por DAAR
```
