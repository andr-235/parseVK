-- CreateTable
CREATE TABLE "Listing" (
    "id" SERIAL PRIMARY KEY,
    "source" TEXT,
    "externalId" TEXT,
    "title" TEXT,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "price" INTEGER,
    "currency" TEXT,
    "address" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "rooms" INTEGER,
    "areaTotal" DOUBLE PRECISION,
    "areaLiving" DOUBLE PRECISION,
    "areaKitchen" DOUBLE PRECISION,
    "floor" INTEGER,
    "floorsTotal" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "contactName" TEXT,
    "contactPhone" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_url_key" ON "Listing"("url");

-- CreateIndex
CREATE INDEX "Listing_city_idx" ON "Listing"("city");

-- CreateIndex
CREATE INDEX "Listing_price_idx" ON "Listing"("price");
