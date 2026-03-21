'use client';

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';
import { useT } from '@/hooks/use-t';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface AddPaymentMethodProps {
  userId?: string;
  clientSecret: string;
  onAdded: () => void;
  onCancel: () => void;
}

export function AddPaymentMethod({
  userId,
  clientSecret,
  onAdded,
  onCancel,
}: AddPaymentMethodProps) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <AddPaymentMethodForm userId={userId} onAdded={onAdded} onCancel={onCancel} />
    </Elements>
  );
}

function AddPaymentMethodForm({
  userId,
  onAdded,
  onCancel,
}: Omit<AddPaymentMethodProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useT();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || t('paymentMethodUi.verificationError'));
        toast.error(error.message);
      } else {
        toast.success(t('paymentMethodUi.verifiedAndSavedSuccess'));
        onAdded();
      }
    } catch (err: any) {
      setErrorMessage(err.message || t('paymentMethodUi.verificationFailed'));
      toast.error(t('paymentMethodUi.saveCardFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-none shadow-lg animate-in zoom-in-95 duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">{t('paymentMethodUi.addNewCard')}</CardTitle>
          <CardDescription>{t('paymentMethodUi.verifyAndSaveCard')}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 text-slate-400">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <PaymentElement options={{ layout: 'tabs' }} />
          </div>

          {errorMessage && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 italic">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!stripe || isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('paymentMethodUi.verifying')}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('paymentMethodUi.saveCard')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
