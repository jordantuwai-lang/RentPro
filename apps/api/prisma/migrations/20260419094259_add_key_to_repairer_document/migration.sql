-- AlterTable
ALTER TABLE "RepairerDocument" ADD COLUMN     "key" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "fileData" SET DEFAULT '';
