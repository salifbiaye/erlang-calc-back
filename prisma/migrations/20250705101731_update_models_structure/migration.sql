/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Simulation` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Simulation` table. All the data in the column will be lost.
  - You are about to drop the column `parameters` on the `Simulation` table. All the data in the column will be lost.
  - You are about to drop the `SimulationShare` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `inputs` to the `Simulation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Simulation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Simulation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SimulationType" AS ENUM ('CHANNELS', 'BLOCKING_RATE', 'TRAFFIC', 'FROM_USERS', 'ADVANCED');

-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "SimulationShare" DROP CONSTRAINT "SimulationShare_simulationId_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "updatedAt",
ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Simulation" DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "parameters",
ADD COLUMN     "aiAnalysis" TEXT,
ADD COLUMN     "chartData" JSONB,
ADD COLUMN     "inputs" JSONB NOT NULL,
ADD COLUMN     "status" "SimulationStatus" NOT NULL,
ADD COLUMN     "type" "SimulationType" NOT NULL,
ADD COLUMN     "zoneId" TEXT;

-- DropTable
DROP TABLE "SimulationShare";

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "population" INTEGER NOT NULL,
    "mobileAccessRate" DOUBLE PRECISION NOT NULL,
    "avgCallsPerHour" DOUBLE PRECISION NOT NULL,
    "avgCallDuration" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedSimulation" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canShare" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedSimulation_simulationId_idx" ON "SharedSimulation"("simulationId");

-- CreateIndex
CREATE INDEX "SharedSimulation_toUserId_idx" ON "SharedSimulation"("toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedSimulation_simulationId_toUserId_key" ON "SharedSimulation"("simulationId", "toUserId");

-- CreateIndex
CREATE INDEX "Simulation_zoneId_idx" ON "Simulation"("zoneId");

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedSimulation" ADD CONSTRAINT "SharedSimulation_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedSimulation" ADD CONSTRAINT "SharedSimulation_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
