-- AlterEnum
ALTER TYPE "ClaimStatus" ADD VALUE 'INVOICING';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "invoiceNumber" TEXT;
