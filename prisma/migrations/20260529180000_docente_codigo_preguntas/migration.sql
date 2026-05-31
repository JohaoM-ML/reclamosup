-- Docente.codigo
ALTER TABLE "Docente" ADD COLUMN "codigo" TEXT;

WITH numbered AS (
  SELECT "userId", ROW_NUMBER() OVER (ORDER BY "userId") AS rn
  FROM "Docente"
  WHERE "codigo" IS NULL
)
UPDATE "Docente" d
SET "codigo" = '000' || LPAD((900000 + n.rn)::text, 6, '0')
FROM numbered n
WHERE d."userId" = n."userId";

UPDATE "Docente"
SET "codigo" = '000100001'
WHERE "userId" IN (
  SELECT u."id" FROM "User" u WHERE u."email" = 'pa.tueroc@alum.up.edu.pe'
);

ALTER TABLE "Docente" ALTER COLUMN "codigo" SET NOT NULL;
CREATE UNIQUE INDEX "Docente_codigo_key" ON "Docente"("codigo");

-- Reclamo.preguntasMarcadas (reemplaza preguntaMarcada)
ALTER TABLE "Reclamo" ADD COLUMN "preguntasMarcadas" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

UPDATE "Reclamo"
SET "preguntasMarcadas" = ARRAY["preguntaMarcada"]
WHERE "preguntaMarcada" IS NOT NULL;

ALTER TABLE "Reclamo" DROP COLUMN "preguntaMarcada";
