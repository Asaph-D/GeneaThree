import { API_BASE_URL } from '../config/api';

export type PaidPlanCode = 'FAMILY_MONTHLY' | 'HERITAGE_YEARLY';
export type MobileOperator = 'MTN' | 'ORANGE';
export interface PaymentState { reference: string; status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED'; planCode: PaidPlanCode; amountXaf: number; message?: string; redirectUrl?: string; }

async function parse<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const problem = await response.json().catch(() => null) as { detail?: string } | null;
  throw new Error(problem?.detail || 'Le service de paiement ne répond pas.');
}

export async function initiatePayment(input: { planCode: PaidPlanCode; phoneNumber: string; operator: MobileOperator; email?: string }): Promise<PaymentState> {
  return parse(await fetch(`${API_BASE_URL}/payments/initiate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }));
}

export async function initiateCardPayment(input: { planCode: PaidPlanCode; firstName: string; lastName: string; email: string; phoneNumber: string; address: string; city: string }): Promise<PaymentState> {
  return parse(await fetch(`${API_BASE_URL}/payments/card/initiate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }));
}

export async function getPaymentStatus(reference: string): Promise<PaymentState> {
  return parse(await fetch(`${API_BASE_URL}/payments/${encodeURIComponent(reference)}`));
}
