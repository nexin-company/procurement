/**
 * Cliente API para comunicarse con las rutas API de Next.js
 * Las rutas API actúan como proxy y manejan la autenticación y API key server-side
 */

const PROCUREMENT_API_BASE_URL = '/api/procurement/v1';
const LOGISTIC_API_BASE_URL = '/api/logistic/v1';
const PERMIT_API_BASE_URL = '/api/permit/v1';
const FINANCE_API_BASE_URL = '/api/finance/v1';

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

async function fetchApi<T>(
  baseUrl: string,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

// ==================== USUARIOS ====================

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string | Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    return fetchApi<User[]>(PERMIT_API_BASE_URL, '/users/');
  },

  getById: async (id: number): Promise<User> => {
    return fetchApi<User>(PERMIT_API_BASE_URL, `/users/${id}`);
  },
};

// ==================== PROVEEDORES ====================

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateSupplierInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateSupplierInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const suppliersApi = {
  getAll: async (): Promise<Supplier[]> => {
    const res = await fetchApi<{ data: Supplier[] }>(PROCUREMENT_API_BASE_URL, '/suppliers');
    return res.data;
  },

  getById: async (id: number): Promise<Supplier> => {
    const res = await fetchApi<{ data: Supplier }>(PROCUREMENT_API_BASE_URL, `/suppliers/${id}`);
    return res.data;
  },

  create: async (data: CreateSupplierInput): Promise<Supplier> => {
    const res = await fetchApi<{ data: Supplier }>(PROCUREMENT_API_BASE_URL, '/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  update: async (id: number, data: UpdateSupplierInput): Promise<Supplier> => {
    const res = await fetchApi<{ data: Supplier }>(PROCUREMENT_API_BASE_URL, `/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  delete: async (id: number): Promise<{ message: string; supplier: Supplier }> => {
    return fetchApi<{ message: string; supplier: Supplier }>(PROCUREMENT_API_BASE_URL, `/suppliers/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== ÓRDENES DE COMPRA ====================

export type PurchaseOrderStatus = 'draft' | 'approved' | 'sent' | 'received' | 'closed' | 'cancelled';

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  externalProductId: number;
  skuSnapshot?: string;
  nameSnapshot?: string;
  quantity: number;
  unitCost: string;
  lineTotal: string;
  createdAt: string | Date;
}

export interface PurchaseOrder {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  status: PurchaseOrderStatus;
  warehouseId: number;
  currency: string;
  total: string;
  notes?: string;
  items?: PurchaseOrderItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreatePurchaseOrderInput {
  supplierId: number;
  warehouseId: number;
  currency?: string;
  notes?: string;
  items: Array<{
    externalProductId: number;
    skuSnapshot?: string;
    nameSnapshot?: string;
    quantity: number;
    unitCost: number;
  }>;
}

export interface UpdatePurchaseOrderInput {
  supplierId?: number;
  status?: PurchaseOrderStatus;
  warehouseId?: number;
  currency?: string;
  notes?: string;
}

export interface PurchaseOrderFilters {
  supplierId?: number;
  status?: PurchaseOrderStatus;
}

export const purchaseOrdersApi = {
  getAll: async (filters?: PurchaseOrderFilters): Promise<PurchaseOrder[]> => {
    const params = new URLSearchParams();
    if (filters?.supplierId) params.set('supplierId', filters.supplierId.toString());
    if (filters?.status) params.set('status', filters.status);
    
    const query = params.toString();
    const res = await fetchApi<{ data: PurchaseOrder[] }>(
      PROCUREMENT_API_BASE_URL,
      `/purchase-orders${query ? `?${query}` : ''}`
    );
    return res.data;
  },

  getById: async (id: number): Promise<PurchaseOrder> => {
    const res = await fetchApi<{ data: PurchaseOrder }>(PROCUREMENT_API_BASE_URL, `/purchase-orders/${id}`);
    return res.data;
  },

  create: async (data: CreatePurchaseOrderInput): Promise<PurchaseOrder> => {
    const res = await fetchApi<{ data: PurchaseOrder }>(PROCUREMENT_API_BASE_URL, '/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  update: async (id: number, data: UpdatePurchaseOrderInput): Promise<PurchaseOrder> => {
    const res = await fetchApi<{ data: PurchaseOrder }>(PROCUREMENT_API_BASE_URL, `/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  updateStatus: async (id: number, toStatus: PurchaseOrderStatus, reason?: string): Promise<PurchaseOrder> => {
    const res = await fetchApi<{ data: PurchaseOrder }>(PROCUREMENT_API_BASE_URL, `/purchase-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ toStatus, reason }),
    });
    return res.data;
  },

  delete: async (id: number): Promise<{ message: string; purchaseOrder: PurchaseOrder }> => {
    return fetchApi<{ message: string; purchaseOrder: PurchaseOrder }>(PROCUREMENT_API_BASE_URL, `/purchase-orders/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== RECEPCIONES ====================

export interface ReceiptItem {
  id: number;
  receiptId: number;
  externalProductId: number;
  skuSnapshot?: string;
  nameSnapshot?: string;
  quantityReceived: number;
  createdAt: string | Date;
}

export interface Receipt {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  purchaseOrderId?: number;
  purchaseOrder?: PurchaseOrder;
  warehouseId: number;
  reference?: string;
  items?: ReceiptItem[];
  receivedAt: string | Date;
  createdAt: string | Date;
}

export interface CreateReceiptInput {
  supplierId: number;
  purchaseOrderId?: number;
  warehouseId: number;
  reference?: string;
  items: Array<{
    externalProductId: number;
    skuSnapshot?: string;
    nameSnapshot?: string;
    quantityReceived: number;
  }>;
}

export interface ReceiptFilters {
  supplierId?: number;
  purchaseOrderId?: number;
}

export const receiptsApi = {
  getAll: async (filters?: ReceiptFilters): Promise<Receipt[]> => {
    const params = new URLSearchParams();
    if (filters?.supplierId) params.set('supplierId', filters.supplierId.toString());
    if (filters?.purchaseOrderId) params.set('purchaseOrderId', filters.purchaseOrderId.toString());
    
    const query = params.toString();
    const res = await fetchApi<{ data: Receipt[] }>(
      PROCUREMENT_API_BASE_URL,
      `/receipts${query ? `?${query}` : ''}`
    );
    return res.data;
  },

  getById: async (id: number): Promise<Receipt> => {
    const res = await fetchApi<{ data: Receipt }>(PROCUREMENT_API_BASE_URL, `/receipts/${id}`);
    return res.data;
  },

  create: async (data: CreateReceiptInput): Promise<Receipt> => {
    const res = await fetchApi<{ data: Receipt }>(PROCUREMENT_API_BASE_URL, '/receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};

// ==================== INVENTORY (para consultas) ====================

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
    const res = await fetchApi<{ data: ExternalProduct[] }>(LOGISTIC_API_BASE_URL, '/catalog');
    return res.data;
  },

  getWarehouses: async (): Promise<Warehouse[]> => {
    const res = await fetchApi<{ data: Warehouse[] }>(LOGISTIC_API_BASE_URL, '/warehouses');
    return res.data;
  },
};

// ==================== NOTIFICACIONES ====================

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string | Date;
}

export const notificationsApi = {
  getUnreadCount: async (userId: number): Promise<{ count: number }> => {
    return fetchApi<{ count: number }>(PERMIT_API_BASE_URL, `/notifications/${userId}/unread-count`);
  },

  getAll: async (userId: number): Promise<Notification[]> => {
    return fetchApi<Notification[]>(PERMIT_API_BASE_URL, `/notifications/${userId}`);
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await fetchApi<void>(PERMIT_API_BASE_URL, `/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async (userId: number): Promise<void> => {
    await fetchApi<void>(PERMIT_API_BASE_URL, `/notifications/${userId}/read-all`, {
      method: 'PUT',
    });
  },
};

// ==================== FINANCE AP ====================

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
    const res = await fetchApi<{ data: ApInvoice }>(FINANCE_API_BASE_URL, '/ap/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};

