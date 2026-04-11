/*
  Warnings:

  - The values [BDM,DRIVER,REPAIRER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'LEADERSHIP', 'OPS_MANAGER', 'BRANCH_MANAGER', 'RECOVERY_MANAGER', 'CLAIMS_MANAGER', 'SALES_MANAGER', 'FLEET_MANAGER', 'FINANCE_MANAGER', 'CLAIMS_TEAM_IN', 'CLAIMS_TEAM_OUT', 'CLAIMS_TEAM_LIABILITY', 'CSE_DRIVER', 'SALES_REP', 'RECOVERY_AGENT', 'FLEET_COORDINATOR');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CSE_DRIVER';
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CSE_DRIVER';
