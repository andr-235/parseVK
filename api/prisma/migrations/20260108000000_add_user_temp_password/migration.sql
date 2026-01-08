-- Add temporary password flag for forced password change
ALTER TABLE "User" ADD COLUMN "isTemporaryPassword" BOOLEAN NOT NULL DEFAULT false;
