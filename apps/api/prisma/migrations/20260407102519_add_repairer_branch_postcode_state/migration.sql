-- AlterTable
ALTER TABLE "Repairer" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "state" TEXT;

-- AddForeignKey
ALTER TABLE "Repairer" ADD CONSTRAINT "Repairer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
