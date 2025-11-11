-- AlterTable
ALTER TABLE "Listing"
ADD COLUMN "manualOverrides" JSONB NOT NULL DEFAULT '[]'::jsonb;

