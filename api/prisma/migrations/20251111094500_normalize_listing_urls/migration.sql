-- Remove duplicate listings by canonical URL (origin + path without query/hash)
WITH ranked AS (
  SELECT
    id,
    split_part(split_part(url, '#', 1), '?', 1) AS canonical_url,
    ROW_NUMBER() OVER (
      PARTITION BY split_part(split_part(url, '#', 1), '?', 1)
      ORDER BY COALESCE("sourceParsedAt", "updatedAt") DESC, "updatedAt" DESC, id DESC
    ) AS rn
  FROM "Listing"
)
DELETE FROM "Listing"
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- Normalize stored URL by stripping query parameters and hash fragments
UPDATE "Listing"
SET url = split_part(split_part(url, '#', 1), '?', 1),
    "updatedAt" = NOW();

