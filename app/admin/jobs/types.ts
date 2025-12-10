export type JobStatus = 'created' | 'in_progress' | 'completed' | 'canceled';

export interface Job {
  id: string;
  customerId: string;
  areaId: string;
  service: string;
  priceQuoted: number;
  status: JobStatus;
  scheduledAt?: any;
  createdAt?: any;
  updatedAt?: any;
}
