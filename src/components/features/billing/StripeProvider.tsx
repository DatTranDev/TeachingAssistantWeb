'use client';

import React, { ReactNode, useMemo } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '', {
  locale: 'en',
  developerTools: {
    assistant: {
      enabled: false
    }
  }
} as any);

export function StripeProvider({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
