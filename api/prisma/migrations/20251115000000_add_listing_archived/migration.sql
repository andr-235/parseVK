-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Listing_archived_idx" ON "Listing"("archived");

