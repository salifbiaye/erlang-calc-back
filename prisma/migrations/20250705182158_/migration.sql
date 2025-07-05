/*
  Warnings:

  - The values [BLOCKING_RATE,FROM_USERS,ADVANCED] on the enum `SimulationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `inputs` on the `Simulation` table. All the data in the column will be lost.
  - You are about to drop the column `results` on the `Simulation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Simulation` table. All the data in the column will be lost.
  - You are about to drop the column `zoneId` on the `Simulation` table. All the data in the column will be lost.
  - You are about to drop the `Zone` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `formData` to the `Simulation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SimulationType_new" AS ENUM ('CHANNELS', 'BLOCKING', 'TRAFFIC', 'POPULATION');
ALTER TABLE "Simulation" ALTER COLUMN "type" TYPE "SimulationType_new" USING ("type"::text::"SimulationType_new");
ALTER TYPE "SimulationType" RENAME TO "SimulationType_old";
ALTER TYPE "SimulationType_new" RENAME TO "SimulationType";
DROP TYPE "SimulationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Simulation" DROP CONSTRAINT "Simulation_zoneId_fkey";

-- DropIndex
DROP INDEX "Simulation_zoneId_idx";

-- AlterTable
ALTER TABLE "Simulation" DROP COLUMN "inputs",
DROP COLUMN "results",
DROP COLUMN "status",
DROP COLUMN "zoneId",
ADD COLUMN     "formData" JSONB NOT NULL,
ADD COLUMN     "result" DOUBLE PRECISION,
ADD COLUMN     "zoneDisplayName" TEXT,
ADD COLUMN     "zoneLat" DOUBLE PRECISION,
ADD COLUMN     "zoneLon" DOUBLE PRECISION;

-- DropTable
DROP TABLE "Zone";
