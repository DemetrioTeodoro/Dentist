-- CreateEnum
CREATE TYPE "public"."StockMoveType" AS ENUM ('IN', 'OUT', 'ADJUST', 'PROCEDURE');

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "stock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "minStock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProcedureMaterial" (
    "id" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ProcedureMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "public"."StockMoveType" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "treatmentItemId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "public"."Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedureMaterial_procedureId_productId_key" ON "public"."ProcedureMaterial"("procedureId", "productId");

-- CreateIndex
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "public"."StockMovement"("productId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ProcedureMaterial" ADD CONSTRAINT "ProcedureMaterial_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "public"."Procedure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcedureMaterial" ADD CONSTRAINT "ProcedureMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_treatmentItemId_fkey" FOREIGN KEY ("treatmentItemId") REFERENCES "public"."TreatmentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
