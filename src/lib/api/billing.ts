import axios from 'axios';
import { apiClient } from './client';

// The billing service might run on a different port/URL in dev
const BILLING_API_URL = process.env.NEXT_PUBLIC_BILLING_API_URL;

/**
 * We create a specialized client for billing but we want to reuse
 * the authorization headers if possible.
 * Since the main apiClient already has interceptors, we can use it
 * if we provide the absolute URL, or create a new instance and
 * copy the interceptors.
 */

export interface CreditPack {
  id: string;
  totalAmount: number;
  remainingAmount: number;
  type: 'ai' | 'storage';
  purchasedAt: string;
  expiresAt: string;
}

export interface BillingStatus {
  subscription: {
    planId: string;
    planName?: string;
    status: string;
    currentPeriodEnd: string;
    currentPeriodStart?: string;
    baseAiLimit: number;
    baseStorageQuota: number;
    addonStorageQuota: number;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
  };
  usage: {
    monthlyAiUsed: number;
    monthlyAiLimit: number;
    purchasedAiUsed: number;
    purchasedAiTotal: number;

    monthlyStorageUsed: number;
    monthlyStorageLimit: number;
    purchasedStorageUsed: number;
    purchasedStorageTotal: number;
  };
  aiAddons: CreditPack[];
  storageAddons: CreditPack[];
  wallet: {
    liquidBalance: number;
    planBalance: number;
  };
}

export interface Price {
  id: string;
  lookupKey: string;
  unitAmount: number;
  currency: string;
  interval: 'month' | 'year' | '';
  nickname?: string;
  metadata?: Record<string, string>;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  features: string[];
  prices: Price[];
  metadata: Record<string, string>;
}

export interface UserAddonsResponse {
  aiPacks: CreditPack[];
  storagePacks: CreditPack[];
}

export interface UsageEvent {
  type: string;
  amount: number;
  description: string;
  timestamp: string;
}

export const billingApi = {
  /**
   * Get current user's billing status, usage and wallet balance
   */
  getStatus: async (userId: string): Promise<BillingStatus> => {
    // We use the main apiClient but override the URL to hit the billing service
    const { data } = await apiClient.get<BillingStatus>(
      `${BILLING_API_URL}/status?userId=${userId}`
    );
    return data;
  },

  /**
   * Create a checkout session for a subscription plan
   */
  createCheckoutSession: async (
    userId: string,
    email: string,
    priceRef: string
  ): Promise<{ url: string }> => {
    const { data } = await apiClient.post<{ url: string }>(`${BILLING_API_URL}/checkout`, {
      userId,
      email,
      priceRef,
      successUrl: `${window.location.origin}/billing/success`,
      cancelUrl: `${window.location.origin}/billing`,
    });
    return data;
  },

  /**
   * Create a checkout session for a storage addon
   */
  createAddon: async (
    userId: string,
    email: string,
    priceRef: string,
    quantity: number = 1
  ): Promise<{ url: string }> => {
    const { data } = await apiClient.post<{ url: string }>(`${BILLING_API_URL}/addon`, {
      userId,
      email,
      priceRef,
      quantity,
      successUrl: `${window.location.origin}/billing/success`,
      cancelUrl: `${window.location.origin}/billing`,
    });
    return data;
  },

  /**
   * Create a Customer Portal session for subscription management
   */
  createPortalSession: async (userId: string): Promise<{ url: string }> => {
    const { data } = await apiClient.post<{ url: string }>(
      `${BILLING_API_URL}/portal?userId=${userId}&returnUrl=${encodeURIComponent(window.location.origin + '/billing')}`
    );
    return data;
  },

  /**
   * Create a SetupIntent for saving a new card
   */
  createSetupIntent: async (userId: string): Promise<{ client_secret: string }> => {
    const { data } = await apiClient.post<{ client_secret: string }>(
      `${BILLING_API_URL}/setup-intent?userId=${userId}`
    );
    return data;
  },

  /**
   * List saved payment methods
   */
  getPaymentMethods: async (userId: string): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>(
      `${BILLING_API_URL}/payment-methods?userId=${userId}`
    );
    return data;
  },

  /**
   * Set a default payment method
   */
  setDefaultPaymentMethod: async (userId: string, paymentMethodId: string): Promise<void> => {
    await apiClient.post(`${BILLING_API_URL}/payment-methods/default?userId=${userId}`, {
      paymentMethodId,
    });
  },

  /**
   * Remove a payment method
   */
  detachPaymentMethod: async (paymentMethodId: string): Promise<void> => {
    await apiClient.delete(`${BILLING_API_URL}/payment-methods/${paymentMethodId}`);
  },

  /**
   * List invoice history
   */
  listInvoices: async (userId: string, limit: number = 10): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>(
      `${BILLING_API_URL}/invoices?userId=${userId}&limit=${limit}`
    );
    return data;
  },

  /**
   * Directly charge a saved card for one-time purchases
   */
  directCharge: async (
    userId: string,
    priceRef: string,
    paymentMethodId: string,
    quantity: number = 1
  ): Promise<any> => {
    const { data } = await apiClient.post(`${BILLING_API_URL}/charge`, {
      userId,
      priceRef,
      paymentMethodId,
      quantity,
    });
    return data;
  },

  /**
   * Directly subscribe to a plan using a saved card
   */
  directSubscribe: async (
    userId: string,
    priceRef: string,
    paymentMethodId: string,
    subType: 'plan' | 'storage'
  ): Promise<any> => {
    const { data } = await apiClient.post(`${BILLING_API_URL}/subscribe`, {
      userId,
      priceRef,
      paymentMethodId,
      subType,
    });
    return data;
  },

  /**
   * Get available subscription plans from Stripe
   */
  getPlans: async (): Promise<Plan[]> => {
    const { data } = await apiClient.get<Plan[]>(`${BILLING_API_URL}/plans`);
    return data;
  },
  /**
   * Get available addon packs from Stripe
   */
  getAddons: async (): Promise<Plan[]> => {
    const { data } = await apiClient.get<Plan[]>(`${BILLING_API_URL}/addons`);
    return data;
  },

  /**
   * Get the user's purchased addon packs (AI credits + storage) from wallet
   */
  getUserAddons: async (userId: string): Promise<UserAddonsResponse> => {
    const { data } = await apiClient.get<UserAddonsResponse>(
      `${BILLING_API_URL}/user-addons?userId=${userId}`
    );
    return data;
  },

  /**
   * Get the user's usage log events for AI tokens or storage
   * @param type - 'AI_TOKEN' | 'STORAGE_BYTE' or empty string for all
   */
  getUsageLog: async (userId: string, type?: string, limit: number = 50): Promise<UsageEvent[]> => {
    const params = new URLSearchParams({ userId, limit: String(limit) });
    if (type) params.set('type', type);
    const { data } = await apiClient.get<UsageEvent[]>(`${BILLING_API_URL}/usage-log?${params}`);
    return data;
  },
};
