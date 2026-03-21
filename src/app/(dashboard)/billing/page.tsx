'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { billingApi, BillingStatus } from '@/lib/api/billing';
import { PricingCards } from '@/components/features/billing/PricingCards';
import { AddPaymentMethod } from '@/components/features/billing/AddPaymentMethod';
import { AddonCheckoutModal } from '@/components/features/billing/AddonCheckoutModal';
import { InvoiceHistory } from '@/components/features/billing/InvoiceHistory';
import {
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Separator,
  Button,
} from '@/components/ui';
import {
  CreditCard,
  History,
  Cpu,
  HardDrive,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Zap,
  Clock,
  Users,
  Database,
  ChevronRight,
  XCircle,
  Trash2,
  Star,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';

export default function BillingPage() {
  const { user } = useAuthStore();
  const { locale, t } = useT();
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = user?._id || '';

  const {
    data: status,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['billing', 'status', userId],
    queryFn: () => billingApi.getStatus(userId),
    enabled: !!userId,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['billing', 'payment-methods', userId],
    queryFn: () => billingApi.getPaymentMethods(userId),
    enabled: !!userId,
  });

  const [activeTab, setActiveTab] = useState('plans');
  const [showAddCard, setShowAddCard] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => billingApi.getPlans(),
  });

  const { data: userAddons } = useQuery({
    queryKey: ['billing', 'user-addons', userId],
    queryFn: () => billingApi.getUserAddons(userId),
    enabled: !!userId,
  });

  const handlePlanSelect = (lookupKey: string) => {
    router.push(`/checkout?lookupKey=${lookupKey}`);
  };

  // Derive the display plan name from the status API directly (most reliable)
  const displayPlanName =
    status?.subscription?.planName ||
    (status?.subscription?.planId ? `${status.subscription.planId} Plan` : 'Free Plan');

  // For price, find the matching plan from plans list if available
  const currentPlan = plans?.find(
    (p) => p.metadata?.producat_tier?.toLowerCase() === status?.subscription?.planId?.toLowerCase()
  );
  const currentPrice = currentPlan?.prices.find((p) => p.interval === 'month');
  const currentPriceFormatted = currentPrice
    ? `$${currentPrice.unitAmount / 100} USD/mo`
    : status?.subscription?.planId === 'Free' || status?.subscription?.planId === 'free'
      ? '$0 USD/mo'
      : null;

  const handleAddPaymentMethod = async () => {
    try {
      const { client_secret } = await billingApi.createSetupIntent(userId);
      setSetupClientSecret(client_secret);
      setShowAddCard(true);
    } catch (err) {
      toast.error(t('billingUi.paymentMethodSetupInitFailed'));
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { url } = await billingApi.createPortalSession(userId);
      window.location.href = url;
    } catch (error) {
      toast.error(t('billingUi.billingPortalOpenFailed'));
    }
  };

  if (isLoading && !status) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const aiMonthlyLimit = status?.usage?.monthlyAiLimit || 100;
  const aiMonthlyUsed = status?.usage?.monthlyAiUsed || 0;
  const aiPurchasedTotal = status?.usage?.purchasedAiTotal || 0;
  const aiPurchasedUsed = status?.usage?.purchasedAiUsed || 0;

  const aiTotalLimit = aiMonthlyLimit + aiPurchasedTotal;
  const aiTotalUsed = aiMonthlyUsed + aiPurchasedUsed;
  const aiTotalPercentage = Math.min((aiTotalUsed / (aiTotalLimit || 1)) * 100, 100);

  const storageMonthlyLimit = status?.usage?.monthlyStorageLimit || 0.5 * 1024 * 1024 * 1024;
  const storageMonthlyUsed = status?.usage?.monthlyStorageUsed || 0;
  const storagePurchasedTotal = status?.usage?.purchasedStorageTotal || 0;
  const storagePurchasedUsed = status?.usage?.purchasedStorageUsed || 0;

  const storageTotalLimit = storageMonthlyLimit + storagePurchasedTotal;
  const storageTotalUsed = storageMonthlyUsed + storagePurchasedUsed;
  const storageTotalPercentage = Math.min((storageTotalUsed / (storageTotalLimit || 1)) * 100, 100);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCredits = (val: number) => {
    return val.toLocaleString(localeTag);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 p-6 pb-24 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          {t('billingUi.title')}
        </h1>
        <p className="text-slate-500 font-bold">{t('billingUi.subtitle')}</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center gap-6 border-b border-slate-100 pb-px mb-10">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            {['plans', 'ai', 'storage'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="px-0 py-3 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:shadow-none rounded-none font-bold text-sm transition-all text-slate-400 hover:text-slate-600 capitalize"
              >
                {tab === 'ai'
                  ? t('billingUi.aiCredits')
                  : tab === 'storage'
                    ? t('billingUi.fileStorage')
                    : t('billingUi.plans')}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent
          value="plans"
          className="mt-0 space-y-12 animate-in slide-in-from-left-4 duration-500"
        >
          {/* Current Plan Card (Prominent) */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                {t('billingUi.currentPlan')}
              </h2>
            </div>
            <Card className="rounded-xl border-none bg-blue-400 text-white shadow-md shadow-blue-500/10 overflow-hidden relative group">
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                  <div className="space-y-6 flex-1">
                    <div className="space-y-1.5">
                      <h3 className="text-3xl font-bold leading-tight tracking-tight">
                        {displayPlanName}
                      </h3>
                      <div className="flex items-center gap-2 text-blue-50/90 text-sm font-medium">
                        {currentPriceFormatted && <span>{currentPriceFormatted}</span>}
                        {currentPriceFormatted && (
                          <span className="w-1 h-1 bg-white/30 rounded-full" />
                        )}
                        <span>
                          {status?.subscription?.currentPeriodStart
                            ? new Date(status.subscription.currentPeriodStart).toLocaleDateString(
                                localeTag,
                                { month: 'short', day: 'numeric', year: 'numeric' }
                              )
                            : null}
                          {status?.subscription?.currentPeriodStart && ' - '}
                          {status?.subscription?.currentPeriodEnd
                            ? new Date(status.subscription.currentPeriodEnd).toLocaleDateString(
                                localeTag,
                                { month: 'short', day: 'numeric', year: 'numeric' }
                              )
                            : ''}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-2 max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-50/70">
                            {t('billingUi.aiCredits')}
                          </p>
                          <p className="text-base font-bold text-white">
                            {formatCredits(status?.subscription?.baseAiLimit || 2500)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <HardDrive className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-50/70">
                            {t('billingUi.storageShort')}
                          </p>
                          <p className="text-base font-bold text-white">
                            {formatBytes(status?.subscription?.baseStorageQuota || 53687091200)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <PricingCards
            currentPlanId={status?.subscription?.planId}
            onSelectPlan={handlePlanSelect}
            isLoading={isLoading}
          />

          {/* Bottom Navigation Links */}
          <div className="flex flex-col gap-2 pt-6">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-1">
              {t('billingUi.accountUsage')}
            </h2>
            <ManagementLink
              icon={<Zap className="h-5 w-5 text-blue-400" />}
              label={t('billingUi.manageAiCredits')}
              onClick={() => setActiveTab('ai')}
              className="bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-md transition-all p-5 rounded-xl"
            />
            <ManagementLink
              icon={<Database className="h-5 w-5 text-blue-400" />}
              label={t('billingUi.manageFileStorage')}
              onClick={() => setActiveTab('storage')}
              className="bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-md transition-all p-5 rounded-xl"
            />
            <ManagementLink
              icon={<CreditCard className="h-5 w-5 text-blue-400" />}
              label={t('billingUi.paymentSettings')}
              onClick={handleAddPaymentMethod}
              className="bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-md transition-all p-5 rounded-xl"
            />
            <ManagementLink
              icon={<History className="h-5 w-5 text-blue-400" />}
              label={t('billingUi.billingHistory')}
              onClick={() => {}}
              className="bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-md transition-all p-5 rounded-xl"
            />
            <ManagementLink
              icon={<Settings className="h-5 w-5 text-blue-400" />}
              label={t('billingUi.advancedSubscription')}
              onClick={handleManageSubscription}
              className="bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-md transition-all p-5 rounded-xl"
            />
            <Separator className="my-2 bg-slate-100" />
            <ManagementLink
              icon={<Trash2 className="h-5 w-5 text-red-500" />}
              label={t('billingUi.cancelCurrentPlan')}
              onClick={() => {}}
              className="text-red-600 bg-red-50/10 hover:bg-red-50 border border-transparent hover:border-red-100 hover:shadow-md transition-all p-5 rounded-xl"
            />
          </div>
        </TabsContent>

        <TabsContent
          value="ai"
          className="mt-0 space-y-8 animate-in slide-in-from-bottom-4 duration-500"
        >
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-4xl font-black text-slate-900 leading-none">
                  {formatCredits(aiTotalLimit - aiTotalUsed)}{' '}
                  <span className="text-sm font-bold text-slate-400">
                    / {formatCredits(aiTotalLimit || 1)} credits
                  </span>
                </p>
                <p className="text-slate-500 font-bold text-sm tracking-tight">
                  {t('billingUi.aiCreditsRemainingPeriod')}
                </p>
              </div>
              <Button
                onClick={() => setShowAiModal(true)}
                className="bg-blue-400 hover:bg-blue-500 text-white font-black rounded-xl px-8 h-12 shadow-lg shadow-blue-200"
              >
                {t('billingUi.buyMoreCredits')}
              </Button>
            </div>

            <Progress
              value={aiTotalPercentage}
              className="h-4 bg-slate-100 rounded-full"
              indicatorClassName="bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(37,99,235,0.3)]"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              <UsageStatsCard
                title={t('billingUi.monthlyAiCredits')}
                remaining={formatCredits(aiMonthlyLimit - aiMonthlyUsed)}
                percentage={(aiMonthlyUsed / (aiMonthlyLimit || 1)) * 100}
                icon={<Zap className="h-4 w-4" />}
                color="blue"
              />
              <UsageStatsCard
                title={t('billingUi.purchasedCredits')}
                remaining={formatCredits(aiPurchasedTotal - aiPurchasedUsed)}
                percentage={(aiPurchasedUsed / (aiPurchasedTotal || 1)) * 100}
                icon={<Star className="h-4 w-4" />}
                color="purple"
              />
            </div>

            {userAddons && userAddons.aiPacks.length > 0 && (
              <div className="pt-10 space-y-4">
                <h3 className="text-sm font-black text-slate-900 tracking-wider uppercase ml-1">
                  {t('billingUi.purchasedCreditPacks')}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {userAddons.aiPacks.map((pack) => (
                    <AddonListItem key={pack.id} addon={pack} type="ai" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="storage"
          className="mt-0 space-y-8 animate-in slide-in-from-bottom-4 duration-500"
        >
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-4xl font-black text-slate-900 leading-none">
                  {formatBytes(storageTotalLimit - storageTotalUsed)}{' '}
                  <span className="text-sm font-bold text-slate-400">
                    / {formatBytes(storageTotalLimit || 1)}
                  </span>
                </p>
                <p className="text-slate-500 font-bold text-sm tracking-tight">
                  {t('billingUi.fileStorageRemaining')}
                </p>
              </div>
              <Button
                onClick={() => setShowStorageModal(true)}
                className="bg-blue-400 hover:bg-blue-500 text-white font-black rounded-xl px-8 h-12 shadow-lg shadow-blue-200"
              >
                {t('billingUi.increaseStorage')}
              </Button>
            </div>

            <Progress
              value={storageTotalPercentage}
              className="h-4 bg-slate-100 rounded-full"
              indicatorClassName="bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(37,99,235,0.3)]"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              <UsageStatsCard
                title={t('billingUi.baseStorage')}
                remaining={formatBytes(storageMonthlyLimit - storageMonthlyUsed)}
                percentage={(storageMonthlyUsed / (storageMonthlyLimit || 1)) * 100}
                icon={<Database className="h-4 w-4" />}
                color="blue"
              />
              <UsageStatsCard
                title={t('billingUi.addonStorage')}
                remaining={formatBytes(storagePurchasedTotal - storagePurchasedUsed)}
                percentage={(storagePurchasedUsed / (storagePurchasedTotal || 1)) * 100}
                icon={<Plus className="h-4 w-4" />}
                color="indigo"
              />
            </div>

            {userAddons && userAddons.storagePacks.length > 0 && (
              <div className="pt-10 space-y-4">
                <h3 className="text-sm font-black text-slate-900 tracking-wider uppercase ml-1">
                  {t('billingUi.purchasedStoragePacks')}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {userAddons.storagePacks.map((pack) => (
                    <AddonListItem key={pack.id} addon={pack} type="storage" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showAddCard && setupClientSecret && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <AddPaymentMethod
              clientSecret={setupClientSecret}
              onAdded={() => {
                setShowAddCard(false);
                queryClient.invalidateQueries({ queryKey: ['billing', 'payment-methods', userId] });
                refetch();
                toast.success(t('billingUi.paymentMethodAddedSuccess'));
              }}
              onCancel={() => setShowAddCard(false)}
            />
          </div>
        </div>
      )}

      {showAiModal && (
        <AddonCheckoutModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} type="ai" />
      )}

      {showStorageModal && (
        <AddonCheckoutModal
          isOpen={showStorageModal}
          onClose={() => setShowStorageModal(false)}
          type="storage"
        />
      )}

      <footer className="pt-20 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <p>{t('billingUi.footerSecuredByStripe')}</p>
      </footer>
    </div>
  );
}

function UsageStatsCard({
  title,
  remaining,
  percentage,
  icon,
  color,
}: {
  title: string;
  remaining: string;
  percentage: number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'indigo';
}) {
  const { t } = useT();
  const colorMap = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    indigo: 'bg-indigo-600',
  };

  const bgMap = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    indigo: 'bg-indigo-50',
  };

  const textMap = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
  };

  return (
    <div className="space-y-4 p-6 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'h-10 w-10 rounded-2xl flex items-center justify-center',
            bgMap[color],
            textMap[color]
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{title}</p>
          <p className="text-xs font-bold text-slate-400">
            ({remaining} {t('billingUi.remaining')})
          </p>
        </div>
      </div>
      <Progress
        value={percentage}
        className="h-2 bg-slate-50"
        indicatorClassName={colorMap[color]}
      />
    </div>
  );
}

function AddonListItem({ addon, type }: { addon: any; type: 'ai' | 'storage' }) {
  const { locale, t } = useT();
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';
  return (
    <div className="flex items-center justify-between p-5 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all group bg-white">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white group-hover:text-blue-600 transition-all">
          {type === 'ai' ? <Zap className="h-6 w-6" /> : <HardDrive className="h-6 w-6" />}
        </div>
        <div>
          <p className="text-base font-black text-slate-900">
            {type === 'ai' ? addon.totalAmount.toLocaleString(localeTag) : '50 GB'}{' '}
            {t('billingUi.pack')}
          </p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
            {t('billingUi.boughtOn')} {new Date(addon.purchasedAt).toLocaleDateString(localeTag)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-slate-900">
          {type === 'ai' ? addon.remainingAmount.toLocaleString(localeTag) : '12 GB'}{' '}
          {t('billingUi.left')}
        </p>
        <p className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
          {t('billingUi.expires')} {new Date(addon.expiresAt).toLocaleDateString(localeTag)}
        </p>
      </div>
    </div>
  );
}

function ManagementLink({
  icon,
  label,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-all font-bold group',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="text-slate-900 group-hover:scale-110 transition-transform">{icon}</div>
        <span className="text-slate-900">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
    </button>
  );
}
