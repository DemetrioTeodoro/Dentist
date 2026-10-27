-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'DENTIST', 'RECEPTION');

-- CreateEnum
CREATE TYPE "public"."ToothStatus" AS ENUM ('HEALTHY', 'CARIES', 'RESTORED', 'MISSING', 'ENDODONTIC', 'CROWN', 'IMPLANT', 'EXTRACTION_INDICATED', 'FRACTURED');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'DONE', 'NO_SHOW', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."PlanStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."ItemStatus" AS ENUM ('PENDING', 'DONE');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'PIX', 'DEBIT', 'CREDIT', 'TRANSFER', 'INSURANCE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "cro" TEXT,
    "color" TEXT NOT NULL DEFAULT '#0ea5e9',
    "commissionPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "birthDate" DATE,
    "gender" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "responsible" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Anamnesis" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "allergies" TEXT,
    "medications" TEXT,
    "alerts" TEXT,
    "filledById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anamnesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ToothRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "tooth" INTEGER NOT NULL,
    "status" "public"."ToothStatus" NOT NULL,
    "faces" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToothRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClinicalNote" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attachment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Procedure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TreatmentPlan" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "status" "public"."PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreatmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TreatmentItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "tooth" INTEGER,
    "faces" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'PENDING',
    "doneAt" TIMESTAMP(3),
    "doneById" TEXT,

    CONSTRAINT "TreatmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Receivable" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "planId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" DATE NOT NULL,
    "paidAt" TIMESTAMP(3),
    "method" "public"."PaymentMethod",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expense" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "public"."AuditLog"("entity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cpf_key" ON "public"."Patient"("cpf");

-- CreateIndex
CREATE INDEX "Patient_name_idx" ON "public"."Patient"("name");

-- CreateIndex
CREATE INDEX "Anamnesis_patientId_createdAt_idx" ON "public"."Anamnesis"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ToothRecord_patientId_tooth_key" ON "public"."ToothRecord"("patientId", "tooth");

-- CreateIndex
CREATE INDEX "ClinicalNote_patientId_createdAt_idx" ON "public"."ClinicalNote"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_storedName_key" ON "public"."Attachment"("storedName");

-- CreateIndex
CREATE INDEX "Appointment_dentistId_startsAt_idx" ON "public"."Appointment"("dentistId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_startsAt_idx" ON "public"."Appointment"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Procedure_code_key" ON "public"."Procedure"("code");

-- CreateIndex
CREATE INDEX "Receivable_dueDate_idx" ON "public"."Receivable"("dueDate");

-- CreateIndex
CREATE INDEX "Receivable_paidAt_idx" ON "public"."Receivable"("paidAt");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "public"."Expense"("date");

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Anamnesis" ADD CONSTRAINT "Anamnesis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Anamnesis" ADD CONSTRAINT "Anamnesis_filledById_fkey" FOREIGN KEY ("filledById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ToothRecord" ADD CONSTRAINT "ToothRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClinicalNote" ADD CONSTRAINT "ClinicalNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClinicalNote" ADD CONSTRAINT "ClinicalNote_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClinicalNote" ADD CONSTRAINT "ClinicalNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TreatmentItem" ADD CONSTRAINT "TreatmentItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."TreatmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TreatmentItem" ADD CONSTRAINT "TreatmentItem_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "public"."Procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TreatmentItem" ADD CONSTRAINT "TreatmentItem_doneById_fkey" FOREIGN KEY ("doneById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Receivable" ADD CONSTRAINT "Receivable_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Receivable" ADD CONSTRAINT "Receivable_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."TreatmentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
