export interface Payout {
  id: string;
  providerId: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "canceled";
  notes?: string;
  source?: string;
  createdAt?: any; // Firestore Timestamp in emulator
  updatedAt?: any;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  data?: T;
  items?: T[];
  count?: number;
}

export interface UpdatePayoutRequest {
  id: string;
  status: Payout['status'];
  notes?: string;
}

export interface CreatePayoutRequest {
  providerId: string;
  amount: number;
  currency: string;
  notes?: string;
  toUserId?: string;
}

export interface DeletePayoutRequest {
  id: string;
}
