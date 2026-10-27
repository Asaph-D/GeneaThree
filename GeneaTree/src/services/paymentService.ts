import { API_BASE_URL } from '../config/api';

export type PaidPlanCode = 'FAMILY_MONTHLY' | 'HERITAGE_YEARLY';
export type MobileOperator = 'MTN' | 'ORANGE';
export interface PaymentState { reference: string; status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED'; planCode: PaidPlanCode; amountXaf: number; message?: string; redirectUrl?: string; }

async function parse<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const problem = await response.json().catch(() => null) as { detail?: string } | null;
  throw new Error(problem?.detail || 'Le service de paiement ne répond pas.');
}

async function waitForApi(): Promise<void> {
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal, cache: 'no-store' });
      if (response.ok) return;
    } catch { /* Render may still be waking up */ }
    finally { window.clearTimeout(timeout); }
    await new Promise((resolve) => window.setTimeout(resolve, 4000));
  }
  throw new Error('Le service de paiement met trop de temps à démarrer. Réessayez dans un instant.');
}

export async function initiatePayment(input: { planCode: PaidPlanCode; phoneNumber: string; operator: MobileOperator; email?: string }): Promise<PaymentState> {
  await waitForApi();
  return parse(await fetch(`${API_BASE_URL}/payments/initiate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }));
}

export async function getPaymentStatus(reference: string): Promise<PaymentState> {
  return parse(await fetch(`${API_BASE_URL}/payments/${encodeURIComponent(reference)}`));
}
