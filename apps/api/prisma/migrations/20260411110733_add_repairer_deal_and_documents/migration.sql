-- AlterTable
ALTER TABLE "Repairer" ADD COLUMN     "paymentFrequency" TEXT,
ADD COLUMN     "referralAmount" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "RepairerDocument" (
    "id" TEXT NOT NULL,
    "repairerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileData" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairerDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RepairerDocument" ADD CONSTRAINT "RepairerDocument_repairerId_fkey" FOREIGN KEY ("repairerId") REFERENCES "Repairer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
