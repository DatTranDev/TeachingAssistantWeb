'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/lib/api/billing';
import { queryKeys } from '@/lib/api/queryKeys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Trash2, CheckCircle2, Loader2, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/hooks/use-t';

interface PaymentMethodListProps {
  userId: string;
  defaultPaymentMethodId?: string;
  onSelect?: (pmId: string) => void;
  selectedId?: string;
  selectable?: boolean;
}

export function PaymentMethodList({
  userId,
  defaultPaymentMethodId,
  onSelect,
  selectedId,
  selectable = false,
}: PaymentMethodListProps) {
  const queryClient = useQueryClient();
  const { t } = useT();

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ['billing', 'payment-methods', userId],
    queryFn: () => billingApi.getPaymentMethods(userId),
    enabled: !!userId,
  });

  const setDefaultMutation = useMutation({
    mutationFn: (pmId: string) => billingApi.setDefaultPaymentMethod(userId, pmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.status(userId) });
      toast.success(t('paymentMethodUi.defaultUpdated'));
    },
    onError: () => toast.error(t('paymentMethodUi.defaultUpdateFailed')),
  });

  const detachMutation = useMutation({
    mutationFn: (pmId: string) => billingApi.detachPaymentMethod(pmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'payment-methods', userId] });
      toast.success(t('paymentMethodUi.cardRemovedSuccess'));
    },
    onError: () => toast.error(t('paymentMethodUi.cardRemoveFailed')),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!paymentMethods || paymentMethods.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <CreditCard className="mx-auto h-10 w-10 text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm">{t('paymentMethodUi.noSavedMethods')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentMethods.map((pm) => {
        const isSelected = selectedId === pm.id;
        const isDefault = pm.id === defaultPaymentMethodId;

        return (
          <Card
            key={pm.id}
            className={`cursor-pointer border transition-all duration-300 ${
              isSelected
                ? 'border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/30'
                : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
            }`}
            onClick={() => selectable && onSelect?.(pm.id)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-14 bg-slate-900 rounded-md flex items-center justify-center text-white font-bold uppercase text-[10px]">
                  {pm.card.brand}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 leading-none">
                      •••• •••• •••• {pm.card.last4}
                    </p>
                    {isDefault && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] py-0"
                      >
                        {t('paymentMethodUi.default')}
                      </Badge>
                    )}
                    {isSelected && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] py-0"
                      >
                        {t('paymentMethodUi.selected')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('paymentMethodUi.expires')} {pm.card.exp_month}/{pm.card.exp_year}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {!isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDefaultMutation.mutate(pm.id)}
                    disabled={setDefaultMutation.isPending}
                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                    title={t('paymentMethodUi.makeDefault')}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => detachMutation.mutate(pm.id)}
                  disabled={detachMutation.isPending}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                  title={t('paymentMethodUi.removeCard')}
                >
                  {detachMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
