-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_driverId_fkey";

-- AlterTable
ALTER TABLE "Delivery" ALTER COLUMN "driverId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
