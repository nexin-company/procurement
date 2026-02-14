/**
 * Cliente API server-side para comunicarse con procurement-backend
 * La API key se mantiene solo en el servidor
 */

import 'server-only';
import { auth } from '@/lib/auth';
import { 
  User,
  CreateUserInput, 
  UpdateUserInput,
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  PurchaseOrder,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PurchaseOrderFilters,
  Receipt,
  CreateReceiptInput,
  ReceiptFilters,
} from './api';

// Para usuarios, siempre usar el backend de Permit
const PERMIT_API_URL = process.env.PERMIT_API_URL || 'http://localhost:8000';
const PERMIT_API_KEY = process.env.PERMIT_API_KEY || '';

// Para procurement, usar el backend de Procurement
const PROCUREMENT_API_URL = process.env.PROCUREMENT_API_URL || 'http://localhost:8000';
const PROCUREMENT_API_KEY = process.env.PROCUREMENT_API_KEY || '';

// Para logistics (catálogo, stock, warehouses, mappings, shipments)
const LOGISTIC_API_URL = process.env.LOGISTIC_API_URL || 'http://localhost:8004';
const LOGISTIC_API_KEY = process.env.LOGISTIC_API_KEY || '';

// Para finance, usar el backend de Finance
const FINANCE_API_URL = process.env.FINANCE_API_URL || 'http://localhost:8000';
const FINANCE_API_KEY = process.env.FINANCE_API_KEY || '';

if (!PERMIT_API_KEY) {
  console.warn('⚠️ PERMIT_API_KEY no está configurada. Las llamadas al backend pueden fallar.');
}

if (!PROCUREMENT_API_KEY) {
  console.warn('⚠️ PROCUREMENT_API_KEY no está configurada. Las llamadas al backend pueden fallar.');
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Función helper para hacer requests al backend con API key
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
  backend: 'permit' | 'procurement' | 'logistic' | 'finance' = 'procurement'
): Promise<T> {
  // Verificar que el usuario esté autenticado
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('No autenticado', 401);
  }

  const baseUrl = backend === 'permit' ? PERMIT_API_URL 
    : backend === 'logistic' ? LOGISTIC_API_URL 
    : backend === 'finance' ? FINANCE_API_URL
    : PROCUREMENT_API_URL;
  const apiKey = backend === 'permit' ? PERMIT_API_KEY 
    : backend === 'logistic' ? LOGISTIC_API_KEY 
    : backend === 'finance' ? FINANCE_API_KEY
    : PROCUREMENT_API_KEY;
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey, // API key solo en el servidor
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// Re-exportar tipos del cliente público
export type {
  User,
  CreateUserInput,
  UpdateUserInput,
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  PurchaseOrder,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PurchaseOrderFilters,
  Receipt,
  CreateReceiptInput,
  ReceiptFilters,
} from './api';

// ==================== USUARIOS ====================
// Los usuarios siempre vienen del backend de Permit
export const usersApi = {
  getAll: async () => {
    const res = await fetchApi<{ data: User[] }>('/v1/users/', undefined, 'permit');
    return res.data;
  },
  getById: async (id: number) => {
    const res = await fetchApi<{ data: User }>(`/v1/users/${id}`, undefined, 'permit');
    return res.data;
  },
  create: async (data: CreateUserInput) => {
    const res = await fetchApi<{ data: User }>('/v1/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'permit');
    return res.data;
  },
  update: async (id: number, data: UpdateUserInput) => {
    const res = await fetchApi<{ data: User }>(`/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, 'permit');
    return res.data;
  },
  delete: async (id: number) => {
    return fetchApi<{ message: string; user: User }>(`/v1/users/${id}`, {
      method: 'DELETE',
    }, 'permit');
  },
};

// ==================== PROVEEDORES ====================
export const suppliersApi = {
  getAll: async (): Promise<Supplier[]> => {
    const res = await fetchApi<{ data: Supplier[] }>('/v1/suppliers');
    return res.data;
  },

  getById: async (id: number): Promise<Supplier> => {
    const res = await fetchApi<{ data: Supplier }>(`/v1/suppliers/${id}`);
    return res.data;
  },

  create: async (data: CreateSupplierInput): Promise<Supplier> => {
    const res = await fetchApi<{ data: Supplier }>('/v1/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  update: async (id: number, data: UpdateSupplierInput): Promise<Supplier> => {
    const res = await fetchApi<{ data: Supplier }>(`/v1/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  delete: async (id: number): Promise<{ message: string; supplier: Supplier }> => {
    return fetchApi<{ message: string; supplier: Supplier }>(`/v1/suppliers/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== ÓRDENES DE COMPRA ====================
export const purchaseOrdersApi = {
  getAll: async (filters?: PurchaseOrderFilters): Promise<PurchaseOrder[]> => {
    const params = new URLSearchParams();
    if (filters?.supplierId) params.set('supplierId', filters.supplierId.toString());
    if (filters?.status) params.set('status', filters.status);
    
    const query = params.toString();
    const res = await fetchApi<{ data: PurchaseOrder[] }>(
      `/v1/purchase-orders${query ? `?${query}` : ''}`
    );
    return res.data;
  },

  getById: async (id: number): Promise<PurchaseOrder> => {
    const res = await fetchApi<{ data: PurchaseOrder }>(`/v1/purchase-orders/${id}`);
    return res.data;
  },

  create: async (data: CreatePurchaseOrderInput): Promise<PurchaseOrder> => {
    const res = await fetchApi<{ data: PurchaseOrder }>('/v1/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  update: async (id: number, data: UpdatePurchaseOrderInput): Promise<PurchaseOrder> => {
    const res = await fetchApi<{ data: PurchaseOrder }>(`/v1/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  updateStatus: async (id: number, toStatus: string, reason?: string): Promise<PurchaseOrder> => {
    const res = await fetchApi<{ data: PurchaseOrder }>(`/v1/purchase-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ toStatus, reason }),
    });
    return res.data;
  },

  delete: async (id: number): Promise<{ message: string; purchaseOrder: PurchaseOrder }> => {
    return fetchApi<{ message: string; purchaseOrder: PurchaseOrder }>(`/v1/purchase-orders/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== RECEPCIONES ====================
export const receiptsApi = {
  getAll: async (filters?: ReceiptFilters): Promise<Receipt[]> => {
    const params = new URLSearchParams();
    if (filters?.supplierId) params.set('supplierId', filters.supplierId.toString());
    if (filters?.purchaseOrderId) params.set('purchaseOrderId', filters.purchaseOrderId.toString());
    
    const query = params.toString();
    const res = await fetchApi<{ data: Receipt[] }>(
      `/v1/receipts${query ? `?${query}` : ''}`
    );
    return res.data;
  },

  getById: async (id: number): Promise<Receipt> => {
    const res = await fetchApi<{ data: Receipt }>(`/v1/receipts/${id}`);
    return res.data;
  },

  create: async (data: CreateReceiptInput): Promise<Receipt> => {
    const res = await fetchApi<{ data: Receipt }>('/v1/receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};

// ==================== LOGISTICS (para consultas de catálogo y warehouses) ====================
export interface ExternalProduct {
  id: number;
  externalSkuId: string;
  sku: string;
  name: string;
  presentation?: string;
  uom?: string;
  status: string;
  basePrice: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Warehouse {
  id: number;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const inventoryApi = {
  getExternalProducts: async (): Promise<ExternalProduct[]> => {
    const res = await fetchApi<{ data: ExternalProduct[] }>('/v1/catalog', undefined, 'logistic');
    return res.data;
  },

  getWarehouses: async (): Promise<Warehouse[]> => {
    const res = await fetchApi<{ data: Warehouse[] }>('/v1/warehouses', undefined, 'logistic');
    return res.data;
  },
};

// ==================== FINANCE (para crear facturas AP) ====================
export interface CreateApInvoiceInput {
  supplierId: number;
  procurementReceiptId?: number;
  invoiceNumber?: string;
  currency?: string;
  amount: number;
  externalRef?: string;
  dueDate?: string;
  notes?: string;
}

export interface ApInvoice {
  id: number;
  externalRef?: string;
  supplierId: number;
  procurementReceiptId?: number;
  invoiceNumber?: string;
  currency: string;
  amount: string;
  status: string;
  dueDate?: string | Date;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const financeApi = {
  createApInvoice: async (data: CreateApInvoiceInput): Promise<ApInvoice> => {
    const res = await fetchApi<{ data: ApInvoice }>('/v1/ap/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'finance');
    return res.data;
  },
};

