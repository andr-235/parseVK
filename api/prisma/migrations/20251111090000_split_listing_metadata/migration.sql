-- AlterTable
ALTER TABLE "Listing"
  ADD COLUMN "sourceAuthorName" TEXT,
  ADD COLUMN "sourceAuthorPhone" TEXT,
  ADD COLUMN "sourceAuthorUrl" TEXT,
  ADD COLUMN "sourcePostedAt" TEXT,
  ADD COLUMN "sourceParsedAt" TIMESTAMP(3);

WITH meta AS (
  SELECT
    id,
    CASE
      WHEN metadata IS NULL THEN NULL
      WHEN jsonb_typeof(metadata) = 'object' THEN metadata
      WHEN jsonb_typeof(metadata) = 'string'
        AND trim(both '"' FROM metadata::text) <> ''
      THEN
        (
          trim(both '"' FROM metadata::text)
        )::jsonb
      ELSE NULL
    END AS obj
  FROM "Listing"
)
UPDATE "Listing" AS l
SET
  "sourceAuthorName" = COALESCE(meta.obj->>'author', meta.obj->>'author_name', meta.obj->>'contact_name', meta.obj->>'contactName'),
  "sourceAuthorPhone" = COALESCE(meta.obj->>'author_phone', meta.obj->>'contact_phone', meta.obj->>'phone'),
  "sourceAuthorUrl" = COALESCE(meta.obj->>'author_url', meta.obj->>'url'),
  "sourcePostedAt" = COALESCE(meta.obj->>'posted_at', meta.obj->>'postedAt', meta.obj->>'published_at', meta.obj->>'publishedAt'),
  "sourceParsedAt" = CASE
    WHEN meta.obj IS NULL THEN l."sourceParsedAt"
    WHEN meta.obj->>'parsed_at' ~ '^\d{4}-'
      THEN ((meta.obj->>'parsed_at')::timestamptz)::timestamp(3)
    WHEN meta.obj->>'parsedAt' ~ '^\d{4}-'
      THEN ((meta.obj->>'parsedAt')::timestamptz)::timestamp(3)
    ELSE l."sourceParsedAt"
  END
FROM meta
WHERE meta.id = l.id;

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "metadata";

