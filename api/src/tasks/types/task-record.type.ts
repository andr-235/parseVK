export type TaskRecord = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean | null;
  totalItems?: number | null;
  processedItems?: number | null;
  progress?: number | null;
  status?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
