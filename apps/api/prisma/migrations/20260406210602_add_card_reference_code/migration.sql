/*
  Warnings:

  - A unique constraint covering the columns `[referenceCode]` on the table `PaymentCard` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PaymentCard" ADD COLUMN     "referenceCode" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCard_referenceCode_key" ON "PaymentCard"("referenceCode");
