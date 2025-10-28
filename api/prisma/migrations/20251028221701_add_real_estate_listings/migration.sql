-- CreateTable
CREATE TABLE "ListingSource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealEstateListing" (
    "id" SERIAL NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER,
    "address" TEXT,
    "url" TEXT NOT NULL,
    "propertyDetails" JSONB,
    "contentHash" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RealEstateListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingSource_name_key" ON "ListingSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RealEstateListing_sourceId_externalId_key" ON "RealEstateListing"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "RealEstateListing_contentHash_idx" ON "RealEstateListing"("contentHash");

-- CreateIndex
CREATE INDEX "RealEstateListing_publishedAt_idx" ON "RealEstateListing"("publishedAt" DESC);

-- AddForeignKey
ALTER TABLE "RealEstateListing" ADD CONSTRAINT "RealEstateListing_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ListingSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
