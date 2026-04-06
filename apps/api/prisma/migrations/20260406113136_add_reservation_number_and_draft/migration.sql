/*
  Warnings:

  - A unique constraint covering the columns `[reservationNumber]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "reservationNumber" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "ReservationCounter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "current" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "ReservationCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reservationNumber_key" ON "Reservation"("reservationNumber");
