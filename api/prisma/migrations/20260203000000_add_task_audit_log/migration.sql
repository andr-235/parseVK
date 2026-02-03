-- CreateTable
CREATE TABLE "task_audit_logs" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_audit_logs_taskId_createdAt_idx" ON "task_audit_logs"("taskId", "createdAt");

-- AddForeignKey
ALTER TABLE "task_audit_logs" ADD CONSTRAINT "task_audit_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
