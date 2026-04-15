/*
  Warnings:

  - You are about to drop the column `claimHandlerId` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `sourceOfBusiness` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `accidentVehicleMake` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `accidentVehicleModel` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `accidentVehicleRegistration` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `accidentVehicleYear` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `assessmentDate` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `estimateDate` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `hireType` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `policeContactName` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `policeEventNo` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `policePhone` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `repairEndDate` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `repairStartDate` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `repairerInvoiceAmt` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `repairerInvoiceNo` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `settlementReceived` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `thirdPartyRecovery` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `totalLoss` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `towIn` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `typeOfCover` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `witnessName` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `witnessPhone` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "LiabilityStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DISPUTED', 'DENIED');

-- CreateEnum
CREATE TYPE "TypeOfCover" AS ENUM ('CTP', 'TPP', 'COMP');

-- CreateEnum
CREATE TYPE "HireType" AS ENUM ('CREDIT_HIRE', 'DIRECT_HIRE');

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_claimId_fkey";

-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "claimHandlerId",
DROP COLUMN "sourceOfBusiness",
ADD COLUMN     "claimHandlerEmail" TEXT,
ADD COLUMN     "claimHandlerName" TEXT,
ADD COLUMN     "claimHandlerPhone" TEXT,
ADD COLUMN     "excessAmount" DECIMAL(65,30),
ADD COLUMN     "hireType" "HireType",
ADD COLUMN     "isDriverOwner" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "liabilityNotes" TEXT,
ADD COLUMN     "liabilityStatus" "LiabilityStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "policyNumber" TEXT,
ADD COLUMN     "settlementReceived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalLoss" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "towIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "typeOfCover" "TypeOfCover";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "accidentVehicleMake",
DROP COLUMN "accidentVehicleModel",
DROP COLUMN "accidentVehicleRegistration",
DROP COLUMN "accidentVehicleYear",
DROP COLUMN "assessmentDate",
DROP COLUMN "estimateDate",
DROP COLUMN "hireType",
DROP COLUMN "policeContactName",
DROP COLUMN "policeEventNo",
DROP COLUMN "policePhone",
DROP COLUMN "repairEndDate",
DROP COLUMN "repairStartDate",
DROP COLUMN "repairerInvoiceAmt",
DROP COLUMN "repairerInvoiceNo",
DROP COLUMN "settlementReceived",
DROP COLUMN "thirdPartyRecovery",
DROP COLUMN "totalLoss",
DROP COLUMN "towIn",
DROP COLUMN "typeOfCover",
DROP COLUMN "witnessName",
DROP COLUMN "witnessPhone";

-- DropTable
DROP TABLE "Document";

-- CreateTable
CREATE TABLE "AccidentDetails" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "accidentDate" TIMESTAMP(3),
    "accidentTime" TEXT,
    "accidentLocation" TEXT,
    "accidentDescription" TEXT,
    "policeAttended" BOOLEAN NOT NULL DEFAULT false,
    "policeEventNo" TEXT,
    "policeStation" TEXT,
    "policeContactName" TEXT,
    "policePhone" TEXT,
    "witnessName" TEXT,
    "witnessPhone" TEXT,
    "witnessStatement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccidentDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtFaultParty" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "dateOfBirth" TEXT,
    "streetAddress" TEXT,
    "suburb" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "licenceNumber" TEXT,
    "licenceState" TEXT,
    "licenceExpiry" TEXT,
    "vehicleRego" TEXT,
    "vehicleMake" TEXT,
    "vehicleModel" TEXT,
    "vehicleYear" INTEGER,
    "vehicleColour" TEXT,
    "theirInsurer" TEXT,
    "theirPolicyNo" TEXT,
    "theirClaimNo" TEXT,
    "companyName" TEXT,
    "companyABN" TEXT,
    "companyPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtFaultParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairDetails" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "estimateDate" TIMESTAMP(3),
    "assessmentDate" TIMESTAMP(3),
    "repairStartDate" TIMESTAMP(3),
    "repairEndDate" TIMESTAMP(3),
    "invoiceNumber" TEXT,
    "invoiceAmount" DECIMAL(65,30),
    "authorisedAmount" DECIMAL(65,30),
    "thirdPartyRecovery" BOOLEAN NOT NULL DEFAULT false,
    "recoveryAmount" DECIMAL(65,30),
    "repairNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimDocument" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccidentDetails_claimId_key" ON "AccidentDetails"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "AtFaultParty_claimId_key" ON "AtFaultParty"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "RepairDetails_claimId_key" ON "RepairDetails"("claimId");

-- AddForeignKey
ALTER TABLE "AccidentDetails" ADD CONSTRAINT "AccidentDetails_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtFaultParty" ADD CONSTRAINT "AtFaultParty_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairDetails" ADD CONSTRAINT "RepairDetails_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDocument" ADD CONSTRAINT "ClaimDocument_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
