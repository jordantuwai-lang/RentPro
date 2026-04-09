-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_branchId_fkey";

-- AlterTable
ALTER TABLE "Vehicle" ALTER COLUMN "branchId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
