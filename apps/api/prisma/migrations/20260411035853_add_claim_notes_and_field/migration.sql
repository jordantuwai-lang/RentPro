/*
  Warnings:

  - The values [PENDING_APPROVAL,APPROVED,INVOICED,DISPUTED] on the enum `ClaimStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `notes` on the `Claim` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[claimNumber]` on the table `Claim` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ClaimStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');
ALTER TABLE "Claim" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Claim" ALTER COLUMN "status" TYPE "ClaimStatus_new" USING ("status"::text::"ClaimStatus_new");
ALTER TYPE "ClaimStatus" RENAME TO "ClaimStatus_old";
ALTER TYPE "ClaimStatus_new" RENAME TO "ClaimStatus";
DROP TYPE "ClaimStatus_old";
ALTER TABLE "Claim" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- DropForeignKey
ALTER TABLE "Claim" DROP CONSTRAINT "Claim_insurerId_fkey";

-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "notes",
ADD COLUMN     "claimHandlerId" TEXT,
ADD COLUMN     "claimReference" TEXT,
ADD COLUMN     "sourceOfBusiness" TEXT,
ALTER COLUMN "insurerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ClaimNote" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Claim_claimNumber_key" ON "Claim"("claimNumber");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_insurerId_fkey" FOREIGN KEY ("insurerId") REFERENCES "Insurer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimNote" ADD CONSTRAINT "ClaimNote_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
