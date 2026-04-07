/*
  Warnings:

  - The values [IN_MAINTENANCE,AWAITING_REPAIR] on the enum `VehicleStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VehicleStatus_new" AS ENUM ('AVAILABLE', 'BOOKED_FOR_REPAIR', 'BOOKED_FOR_SERVICE', 'CLEAN_NEEDED', 'IN_REPAIR', 'IN_SERVICE', 'NOT_AVAILABLE', 'ON_HIRE', 'RESERVED_FOR_TRANSPORT', 'RETIRED', 'WITH_STAFF');
ALTER TABLE "Vehicle" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "status" TYPE "VehicleStatus_new" USING ("status"::text::"VehicleStatus_new");
ALTER TYPE "VehicleStatus" RENAME TO "VehicleStatus_old";
ALTER TYPE "VehicleStatus_new" RENAME TO "VehicleStatus";
DROP TYPE "VehicleStatus_old";
ALTER TABLE "Vehicle" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;
