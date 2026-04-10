-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_vehicleId_fkey";

-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "vehicleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
