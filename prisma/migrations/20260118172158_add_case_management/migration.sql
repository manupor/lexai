-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LegalMatter" AS ENUM ('PENAL', 'CIVIL', 'LABORAL', 'FAMILIA', 'COMERCIAL', 'ADMINISTRATIVO', 'CONSTITUCIONAL', 'TRANSITO', 'MIGRATORIO', 'AGRARIO', 'AMBIENTAL', 'NOTARIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('LITIGIO', 'CONSULTORIA', 'APELACION', 'CONTRATO', 'TRAMITE', 'DICTAMEN', 'OTRO');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "caseId" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "caseId" TEXT;

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "matter" "LegalMatter" NOT NULL DEFAULT 'OTHER',
    "type" "CaseType" NOT NULL DEFAULT 'OTRO',
    "clientName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
