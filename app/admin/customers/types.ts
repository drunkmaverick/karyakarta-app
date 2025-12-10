export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  area: string;
  active: boolean;
  notes?: string;
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

export interface UpdateCustomerRequest {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  area?: string;
  active?: boolean;
  notes?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  area: string;
  active?: boolean;
  notes?: string;
}

export interface DeleteCustomerRequest {
  id: string;
}
