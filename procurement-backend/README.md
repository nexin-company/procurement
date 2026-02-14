# Procurement Backend

Backend del módulo **Procurement** (compras).

## Endpoints (MVP)

- `GET /v1/suppliers`
- `GET /v1/purchase-orders`
- `GET /v1/receipts`

## Integración con Inventory

Al crear un receipt (`POST /v1/receipts`), el backend hace un **ajuste best-effort** a Inventory:
- `POST /v1/stock-levels/adjust` (Inventory)

Requiere:
- `LOGISTIC_API_URL`
- `LOGISTIC_API_KEY`

# Procurement Backend

Backend del módulo **Procurement** (compras).

## Alcance (MVP)
- Suppliers (proveedores)
- Purchase Orders (PO) + items
- Receipts (recepciones)
- Estados y aprobaciones básicas

## Integraciones
- Inventory: entradas de inventario al recibir
- Finance: AP y programación de pagos
- Permit: usuarios, RBAC, auditoría, notificaciones


