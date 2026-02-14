/**
 * Integración best-effort con Logistics para registrar entradas a stock.
 */

import { emitPermitAuditLog } from '../audit/permit-client.js'

const LOGISTIC_API_URL = process.env.LOGISTIC_API_URL || 'http://localhost:8004'
const LOGISTIC_API_KEY = process.env.LOGISTIC_API_KEY || ''

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function postJsonWithTimeout(url: string, body: any, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': LOGISTIC_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function inventoryAdjustStock(input: {
  warehouseId: number
  externalProductId: number
  deltaOnHand: number
  deltaReserved?: number
  reason?: string
}): Promise<void> {
  try {
    if (!LOGISTIC_API_KEY) {
      console.warn('⚠️ LOGISTIC_API_KEY no configurada: saltando ajuste de stock')
      return
    }

    const url = `${LOGISTIC_API_URL}/v1/stock/adjust`
    let lastErr: any = null

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await postJsonWithTimeout(url, input, 3000)
        if (res.ok) return

        const data = await res.json().catch(() => ({}))
        lastErr = { status: res.status, data }
        console.warn('⚠️ Falló ajuste de stock en Logistics:', res.status, data?.message || data)
      } catch (err) {
        lastErr = err
        console.warn(`⚠️ Error llamando Logistics attempt ${attempt}:`, err)
      }

      if (attempt < 2) {
        await sleep(250)
      }
    }

    await emitPermitAuditLog({
      userId: null,
      action: 'integration_failed',
      entityType: 'integrations',
      entityId: null,
      changes: {
        after: {
          source: 'procurement-backend',
          target: 'logistic-backend',
          endpoint: '/v1/stock/adjust',
          method: 'POST',
          reason: input.reason,
          warehouseId: input.warehouseId,
          externalProductId: input.externalProductId,
        },
      },
      metadata: { error: lastErr },
    })
  } catch (err) {
    console.warn('⚠️ Error llamando Logistics:', err)
  }
}


