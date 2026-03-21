'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuthStore } from '@/stores/authStore';
import { billingApi, Price } from '@/lib/api/billing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Check,
  ChevronLeft,
  Loader2,
  Info,
  Globe,
  CreditCard,
  Search,
  X,
  Zap,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useT } from '@/hooks/use-t';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '', {
  locale: 'en',
  developerTools: {
    assistant: {
      enabled: true,
    },
  },
} as any);

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const lookupKey = searchParams.get('lookupKey') || '';
  const type = searchParams.get('type') || 'plan'; // 'plan' or 'addon'
  const { locale, t } = useT();
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';
  const L = {
    reviewAndSubscribe: t('checkoutUi.reviewAndSubscribe'),
    backToBilling: t('checkoutUi.backToBilling'),
    itemNotFound: t('checkoutUi.itemNotFound'),
    checkoutInitError: t('checkoutUi.checkoutInitError'),
    purchaseAiSuccess: t('checkoutUi.purchaseAiSuccess'),
    purchaseStorageSuccess: t('checkoutUi.purchaseStorageSuccess'),
    subscribeSuccess: t('checkoutUi.subscribeSuccess'),
    purchaseWithSavedCard: t('checkoutUi.purchaseWithSavedCard'),
    subscribe: t('checkoutUi.subscribe'),
  };

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingSecret, setIsLoadingSecret] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Split user name for form defaults
  const { firstName, lastName } = useMemo(() => {
    if (!user?.name) return { firstName: '', lastName: '' };
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  }, [user?.name]);

  // Fetch real plan data
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => billingApi.getPlans(),
  });

  // Fetch current billing status for comparison
  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['billing', 'status', user?._id],
    queryFn: () => billingApi.getStatus(user?._id || ''),
    enabled: !!user?._id,
  });
  // Fetch saved payment methods
  const { data: savedPMs, isLoading: isLoadingPMs } = useQuery({
    queryKey: ['billing', 'payment-methods', user?._id],
    queryFn: () => billingApi.getPaymentMethods(user?._id || ''),
    enabled: !!user?._id,
  });

  const [selectedPmId, setSelectedPmId] = useState<string>('new');

  // Set default selection to first saved card if available
  useEffect(() => {
    if (savedPMs && savedPMs.length > 0 && selectedPmId === 'new') {
      const defaultPm = savedPMs.find((pm: any) => pm.isDefault) || savedPMs[0];
      if (defaultPm) setSelectedPmId(defaultPm.id);
    }
  }, [savedPMs]);

  // Fetch addon packs from API (not hardcoded)
  const { data: addonProducts, isLoading: isLoadingAddons } = useQuery({
    queryKey: ['billing-addons'],
    queryFn: () => billingApi.getAddons(),
    enabled: type === 'addon',
  });

  // Derive selected addon by matching lookupKey against any price in any addon product
  const selectedAddonEntry = useMemo(() => {
    if (type !== 'addon' || !addonProducts) return null;
    for (const product of addonProducts) {
      const matchingPrice = product.prices.find((p: Price) => p.lookupKey === lookupKey);
      if (matchingPrice) {
        return { product, price: matchingPrice };
      }
    }
    return null;
  }, [addonProducts, lookupKey, type]);

  const isAddon = type === 'addon';
  const isAiAddon = isAddon && selectedAddonEntry?.product?.metadata?.type === 'addon_ai';
  const isStorageAddon = isAddon && selectedAddonEntry?.product?.metadata?.type === 'addon_storage';

  // Derive display information from the selected addon
  const selectedAddonName =
    selectedAddonEntry?.price?.nickname || selectedAddonEntry?.product?.name || '';
  const selectedAddonPrice = (selectedAddonEntry?.price?.unitAmount || 0) / 100;
  // Extract capacity values from price metadata
  const selectedAddonCredits = parseInt(
    selectedAddonEntry?.price?.metadata?.credits ||
      selectedAddonEntry?.product?.metadata?.credits ||
      '0'
  );
  const selectedAddonStorageGB = parseInt(
    selectedAddonEntry?.price?.metadata?.storage_gb ||
      selectedAddonEntry?.product?.metadata?.storage_gb ||
      '0'
  );

  // Find selected plan and price
  const selectedPlan = useMemo(
    () => plans?.find((p) => p.prices.some((pr: Price) => pr.lookupKey === lookupKey)),
    [plans, lookupKey]
  );
  const selectedPrice = useMemo(
    () => selectedPlan?.prices.find((pr: Price) => pr.lookupKey === lookupKey),
    [selectedPlan, lookupKey]
  );

  const [isAnnual, setIsAnnual] = useState(false);

  // Sync isAnnual with selectedPrice
  useEffect(() => {
    if (selectedPrice) {
      setIsAnnual(selectedPrice.interval === 'year');
    }
  }, [selectedPrice?.interval]);

  // Calculate billing cycle date (Today + 1 Period)
  const billingCycleDate = useMemo(() => {
    const d = new Date();
    if (isAnnual) {
      d.setFullYear(d.getFullYear() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    return d.toLocaleDateString(localeTag, { month: 'long', day: 'numeric', year: 'numeric' });
  }, [isAnnual, localeTag]);

  const displayPrice = (selectedPrice?.unitAmount || 0) / 100;

  useEffect(() => {
    if (!user?._id) return;

    const initCheckout = async () => {
      try {
        const { client_secret } = await billingApi.createSetupIntent(user._id);
        setClientSecret(client_secret);
      } catch (error) {
        toast.error(L.checkoutInitError);
      } finally {
        setIsLoadingSecret(false);
      }
    };

    initCheckout();
  }, [user?._id]);

  if (
    isLoadingSecret ||
    isLoadingPlans ||
    isLoadingStatus ||
    isLoadingPMs ||
    (type === 'addon' && isLoadingAddons)
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-slate-500 animate-pulse font-medium">
          {t('checkoutUi.preparingSecureCheckout')}
        </p>
      </div>
    );
  }

  if (!isAddon && (!selectedPlan || !selectedPrice)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 text-center">
        <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center">
          <X className="h-10 w-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">{L.itemNotFound}</h2>
          <p className="text-slate-500 max-w-xs">{t('checkoutUi.itemNotFoundDesc')}</p>
        </div>
        <Button
          onClick={() => router.push('/billing')}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 h-12 rounded-xl"
        >
          {L.backToBilling}
        </Button>
      </div>
    );
  }

  if (isAddon && !selectedAddonEntry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 text-center">
        <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center">
          <X className="h-10 w-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">{L.itemNotFound}</h2>
          <p className="text-slate-500 max-w-xs">{t('checkoutUi.addonNotFoundDesc')}</p>
        </div>
        <Button
          onClick={() => router.push('/billing')}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 h-12 rounded-xl"
        >
          {L.backToBilling}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-blue-500/10">
      {/* Top Navigation */}
      <header className="px-6 py-4 border-b bg-white flex items-center gap-4 sticky top-0 z-20 shadow-sm shadow-slate-200/20">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
        >
          <ChevronLeft className="h-5 w-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{L.reviewAndSubscribe}</h1>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column - Forms (Lg: 8) */}
          <div className="lg:col-span-8 space-y-8 animate-in slide-in-from-left-4 duration-500">
            {/* Yearly Toggle Card (Only for Plans) */}
            {!isAddon && (
              <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-2xl group hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">
                        {t('checkoutUi.saveYearlyBilling')}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-2 py-0.5 text-[10px] rounded-md uppercase tracking-wider"
                      >
                        {t('checkoutUi.upTo25Off')}
                      </Badge>
                    </div>
                    <Switch
                      checked={isAnnual}
                      onCheckedChange={(val) => {
                        setIsAnnual(val);
                        const otherInterval = val ? 'year' : 'month';
                        const otherPrice = selectedPlan?.prices.find(
                          (p: Price) => p.interval === otherInterval
                        );
                        if (otherPrice) {
                          router.replace(`/checkout?lookupKey=${otherPrice.lookupKey}`);
                        }
                      }}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {isAddon && (
              <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-2xl group hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-xl',
                          isAiAddon ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                        )}
                      >
                        {isAiAddon ? <Zap className="h-5 w-5" /> : <Database className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">
                          {isAiAddon
                            ? t('checkoutUi.aiAddonTitle')
                            : t('checkoutUi.storageAddonTitle')}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">{selectedAddonName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900">
                        ${selectedAddonPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">
                        {isAiAddon ? t('checkoutUi.oneTimeEach') : t('checkoutUi.perMonth')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method Selection */}
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {t('checkoutUi.paymentMethod')}
                </h2>
                <p className="text-sm text-slate-500 font-medium tracking-tight">
                  {t('checkoutUi.choosePayFor')}
                  {isAddon ? selectedAddonName : selectedPlan?.name}
                </p>
              </div>

              <div className="space-y-4">
                {/* Existing Cards */}
                {savedPMs &&
                  savedPMs.length > 0 &&
                  savedPMs.map((pm: any) => (
                    <div
                      key={pm.id}
                      onClick={() => setSelectedPmId(pm.id)}
                      className={cn(
                        'relative group cursor-pointer transition-all',
                        selectedPmId === pm.id ? 'scale-[1.01]' : 'opacity-80 hover:opacity-100'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-xl border bg-white transition-all',
                          selectedPmId === pm.id
                            ? 'border-slate-200 shadow-md bg-blue-50/30'
                            : 'border-slate-200'
                        )}
                      >
                        <div
                          className={cn(
                            'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
                            selectedPmId === pm.id ? 'border-blue-600' : 'border-slate-300'
                          )}
                        >
                          {selectedPmId === pm.id && (
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 w-full">
                          <div className="h-10 w-14 bg-slate-50 border rounded-md flex items-center justify-center shadow-sm uppercase font-black text-xs text-blue-800 italic">
                            {pm.card?.brand || 'CARD'}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-slate-900">
                              {pm.card?.brand?.charAt(0).toUpperCase() + pm.card?.brand?.slice(1)}{' '}
                              {t('checkoutUi.endingIn')} {pm.card?.last4}
                              {pm.isDefault && (
                                <span className="text-blue-500 font-medium ml-2 text-xs">
                                  ({t('checkoutUi.default')})
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {t('checkoutUi.expiry')} {pm.card?.expMonth}/{pm.card?.expYear}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                <Button
                  onClick={() => setSelectedPmId('new')}
                  variant={selectedPmId === 'new' ? 'default' : 'secondary'}
                  className={cn(
                    'w-full h-11 font-bold rounded-lg shadow-sm transition-all active:scale-[0.99]',
                    selectedPmId === 'new'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-600 hover:bg-slate-700 text-white'
                  )}
                >
                  {selectedPmId === 'new'
                    ? t('checkoutUi.addingNewCard')
                    : t('checkoutUi.addNewCard')}
                </Button>

                {/* New Payment Method Highlighted Section */}
                <div
                  className={cn(
                    'p-1 rounded-2xl border-2 transition-all duration-300',
                    selectedPmId === 'new'
                      ? 'border-blue-600 bg-blue-50/30 ring-4 ring-blue-600/5 shadow-xl shadow-blue-600/5'
                      : 'border-transparent opacity-40 grayscale pointer-events-none scale-95 origin-top'
                  )}
                >
                  <div className="p-8 space-y-8 bg-white/50 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        {t('checkoutUi.newPaymentMethod')}
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black border-blue-200 px-1.5 py-0 text-blue-600"
                        >
                          {t('checkoutUi.secure')}
                        </Badge>
                      </h3>
                      <div className="h-5 w-5 rounded-full border-2 border-blue-600 flex items-center justify-center p-1 shadow-sm">
                        <div className="h-full w-full bg-blue-600 rounded-full" />
                      </div>
                    </div>

                    {clientSecret && (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: 'stripe',
                            variables: {
                              colorPrimary: '#3f75e9ff',
                              colorBackground: '#ffffff',
                              colorText: '#0f172a',
                              borderRadius: '12px',
                              fontFamily: 'Inter, system-ui, sans-serif',
                            },
                          },
                        }}
                      >
                        <CustomCheckoutForm
                          userId={user?._id || ''}
                          email={user?.email || ''}
                          lookupKey={lookupKey}
                          isProcessing={isProcessing}
                          setIsProcessing={setIsProcessing}
                          firstName={firstName || ''}
                          lastName={lastName || ''}
                          isAddon={isAddon}
                          isAiAddon={isAiAddon}
                          onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['billing', 'status'] });
                            router.push('/billing?success=true');
                          }}
                        />
                      </Elements>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Details (Lg: 4) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 animate-in slide-in-from-right-4 duration-500 flex flex-col gap-6">
            <Card className="border-slate-200 shadow-xl shadow-slate-200/50 bg-white rounded-2xl overflow-hidden ring-1 ring-slate-200/50">
              <CardContent className="p-8 space-y-8">
                <h2 className="text-lg font-bold text-slate-900">{t('checkoutUi.orderDetails')}</h2>

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'h-14 w-14 rounded-xl flex items-center justify-center border shadow-sm group-hover:scale-105 transition-transform',
                        isAiAddon
                          ? 'bg-blue-50 border-blue-100'
                          : isStorageAddon
                            ? 'bg-purple-50 border-purple-100'
                            : 'bg-emerald-50 border-emerald-100'
                      )}
                    >
                      {isAiAddon ? (
                        <Zap className="h-8 w-8 text-blue-600" />
                      ) : isStorageAddon ? (
                        <Database className="h-8 w-8 text-purple-600" />
                      ) : (
                        <Globe className="h-8 w-8 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {isAddon ? selectedAddonName : selectedPlan?.name}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium tracking-tight">
                        {isAddon
                          ? isAiAddon
                            ? t('checkoutUi.oneTimeAiRefill')
                            : t('checkoutUi.recurringStorage')
                          : isAnnual
                            ? t('checkoutUi.yearlyPlan')
                            : t('checkoutUi.monthlyPlan')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 tracking-tight">
                      $
                      {isAddon
                        ? selectedAddonPrice.toFixed(2)
                        : (selectedPrice?.unitAmount || 0) / 100}{' '}
                      {selectedPrice?.currency?.toUpperCase() || 'USD'}
                    </div>
                  </div>
                </div>

                {isAddon && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {t('checkoutUi.todayVsAfterPurchase')}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">
                          {isAiAddon
                            ? t('checkoutUi.totalAiCredits')
                            : t('checkoutUi.totalStorageCapacity')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-400">
                            {isAiAddon
                              ? (status?.usage?.monthlyAiLimit || 0).toLocaleString()
                              : `${Math.round((status?.usage?.monthlyStorageLimit || 0) / 1024 ** 3)} GB`}
                          </span>
                          <ChevronLeft className="h-3 w-3 text-slate-300 rotate-180" />
                          <span className="text-sm font-black text-blue-600">
                            {isAiAddon
                              ? (
                                  (status?.usage?.monthlyAiLimit || 0) + selectedAddonCredits
                                ).toLocaleString()
                              : `${Math.round((status?.usage?.monthlyStorageLimit || 0) / 1024 ** 3) + selectedAddonStorageGB} GB`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-6">
                    <div className="flex items-center gap-3 font-bold text-slate-900">
                      <div className="h-2 w-2 rounded-sm bg-emerald-600 animate-pulse" />
                      {t('checkoutUi.amountDue')}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">
                        ${isAddon ? selectedAddonPrice.toFixed(2) : displayPrice.toFixed(2)} USD
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase ml-1 opacity-80 tracking-tighter">
                        {isAddon
                          ? isAiAddon
                            ? t('checkoutUi.oneTime')
                            : t('checkoutUi.perMonth')
                          : isAnnual
                            ? t('checkoutUi.perYear')
                            : t('checkoutUi.perMonth')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-8 border-t border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900">{t('checkoutUi.totalCharge')}</h4>
                      <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-black opacity-60">
                        {t('checkoutUi.chargedToday')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-slate-900 tracking-tight">
                        ${isAddon ? selectedAddonPrice.toFixed(2) : displayPrice.toFixed(2)} USD
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-80">
                        {t('checkoutUi.plusApplicableTaxes')}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg transition-all active:scale-[0.98] rounded-xl shadow-lg shadow-blue-600/20 group overflow-hidden relative"
                    disabled={isProcessing}
                    onClick={async () => {
                      if (selectedPmId === 'new') {
                        const form = document.querySelector('#checkout-form') as HTMLFormElement;
                        if (form) form.requestSubmit();
                      } else {
                        // Handle existing card direct purchase
                        setIsProcessing(true);
                        try {
                          if (isAddon) {
                            if (isAiAddon) {
                              await billingApi.directCharge(
                                user?._id || '',
                                lookupKey,
                                selectedPmId
                              );
                              toast.success(L.purchaseAiSuccess);
                            } else {
                              await billingApi.directSubscribe(
                                user?._id || '',
                                lookupKey,
                                selectedPmId,
                                'storage'
                              );
                              toast.success(L.purchaseStorageSuccess);
                            }
                          } else {
                            await billingApi.directSubscribe(
                              user?._id || '',
                              lookupKey,
                              selectedPmId,
                              'plan'
                            );
                            toast.success(L.subscribeSuccess);
                          }
                          queryClient.invalidateQueries({ queryKey: ['billing', 'status'] });
                          router.push('/billing?success=true');
                        } catch (err: any) {
                          toast.error(err.response?.data?.error || t('checkoutUi.paymentFailed'));
                        } finally {
                          setIsProcessing(false);
                        }
                      }
                    }}
                  >
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10 group-hover:h-full transition-all duration-300 pointer-events-none opacity-20" />
                    {isProcessing ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : selectedPmId === 'new' ? (
                      L.subscribe
                    ) : (
                      L.purchaseWithSavedCard
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate-500 font-medium pt-2 tracking-tight">
                    {t('checkoutUi.changeOrCancelAnytime')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-slate-100/50 border border-slate-200/50 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-slate-400 mt-0.5" />
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {t('checkoutUi.paymentSecureNote')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="m9 12 2 2 4-4"></path>
  </svg>
);

function CustomCheckoutForm({
  userId,
  email,
  lookupKey,
  isProcessing,
  setIsProcessing,
  firstName,
  lastName,
  isAddon,
  isAiAddon,
  onSuccess,
}: {
  userId: string;
  email: string;
  lookupKey: string;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  firstName: string;
  lastName: string;
  isAddon: boolean;
  isAiAddon: boolean;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { t } = useT();
  const L = {
    purchaseAiSuccess: t('checkoutUi.purchaseAiSuccess'),
    purchaseStorageSuccess: t('checkoutUi.purchaseStorageSuccess'),
    subscribeSuccess: t('checkoutUi.subscribeSuccess'),
    paymentFailed: t('checkoutUi.paymentFailed'),
    subscriptionFailed: t('checkoutUi.subscriptionFailed'),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || L.paymentFailed);
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        const pmId = setupIntent.payment_method as string;

        if (isAddon) {
          if (isAiAddon) {
            // AI credits are one-time charges
            await billingApi.directCharge(userId, lookupKey, pmId);
            toast.success(L.purchaseAiSuccess);
          } else {
            // Storage addons are recurring subscriptions
            await billingApi.directSubscribe(userId, lookupKey, pmId, 'storage');
            toast.success(L.purchaseStorageSuccess);
          }
        } else {
          await billingApi.directSubscribe(userId, lookupKey, pmId, 'plan');
          toast.success(L.subscribeSuccess);
        }

        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || L.subscriptionFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 group">
          <Label
            htmlFor="first-name"
            className="text-xs font-black uppercase tracking-widest text-slate-500 group-focus-within:text-blue-600 transition-colors ml-0.5"
          >
            {t('checkoutUi.firstName')}
          </Label>
          <Input
            id="first-name"
            placeholder={t('checkoutUi.firstName')}
            className="h-12 border-slate-200 rounded-xl bg-white shadow-sm focus:ring-4 focus:ring-blue-100 transition-all font-bold"
            defaultValue={firstName}
          />
        </div>
        <div className="space-y-2 group">
          <Label
            htmlFor="last-name"
            className="text-xs font-black uppercase tracking-widest text-slate-500 group-focus-within:text-blue-600 transition-colors ml-0.5"
          >
            {t('checkoutUi.lastName')}
          </Label>
          <Input
            id="last-name"
            placeholder={t('checkoutUi.lastName')}
            className="h-12 border-slate-200 rounded-xl bg-white shadow-sm focus:ring-4 focus:ring-blue-100 transition-all font-bold"
            defaultValue={lastName}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-0.5">
          {t('checkoutUi.paymentDetails')}
        </Label>
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <PaymentElement
            options={{
              layout: 'tabs',
              // Force credit card and disable alternatives
              paymentMethodOrder: ['card'],
              wallets: {
                applePay: 'never',
                googlePay: 'never',
              },
              fields: {
                billingDetails: {
                  email: 'never',
                },
              },
            }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2 group">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-500 group-focus-within:text-blue-600 transition-colors ml-0.5">
            {t('checkoutUi.country')}
          </Label>
          <div className="relative">
            <Input
              className="h-12 border-slate-200 rounded-xl bg-white shadow-sm focus:ring-4 focus:ring-blue-100 transition-all font-bold pr-12"
              defaultValue="VN"
            />
            <div className="absolute right-3 top-3 flex items-center gap-2 text-slate-400">
              <X className="h-4 w-4 hover:text-slate-600 cursor-pointer" />
              <Separator orientation="vertical" className="h-5" />
              <ChevronLeft className="h-4 w-4 rotate-270" />
            </div>
          </div>
        </div>

        <div className="space-y-2 group">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-500 group-focus-within:text-blue-600 transition-colors ml-0.5">
            {t('checkoutUi.streetAddress')}
          </Label>
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              className="h-12 border-slate-200 rounded-xl bg-white shadow-sm focus:ring-4 focus:ring-blue-100 transition-all font-bold pl-11"
              placeholder={t('checkoutUi.searchAddress')}
            />
          </div>
        </div>

        <div className="space-y-2 group">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-500 group-focus-within:text-blue-600 transition-colors ml-0.5">
            {t('checkoutUi.postalCode')}
          </Label>
          <Input
            className="h-12 border-slate-200 rounded-xl bg-white shadow-sm focus:ring-4 focus:ring-blue-100 transition-all font-bold"
            placeholder="70000"
          />
        </div>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const { t } = useT();
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-500 font-medium">{t('checkoutUi.loadingCheckout')}</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
