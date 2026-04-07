/*
  Warnings:

  - A unique constraint covering the columns `[fileNumber]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "fileNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_fileNumber_key" ON "Reservation"("fileNumber");
