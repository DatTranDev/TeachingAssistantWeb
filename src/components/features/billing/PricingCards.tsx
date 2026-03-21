import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Check,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Loader2,
  Zap,
  HardDrive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { billingApi, Plan } from '@/lib/api/billing';

interface PricingCardsProps {
  currentPlanId?: string;
  onSelectPlan: (lookupKey: string) => void;
  isLoading?: boolean;
}

export const PricingCards: React.FC<PricingCardsProps> = ({
  currentPlanId,
  onSelectPlan,
  isLoading: isProcessing,
}) => {
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [showAdditionalPlans, setShowAdditionalPlans] = useState(false);

  const { data: plans, isLoading: isFetching } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => billingApi.getPlans(),
  });

  if (isFetching) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Define some ordering and specific highlights
  const sortedPlans = [...(plans || [])].sort((a, b) => {
    const orderA = parseInt(a.metadata?.order || '999');
    const orderB = parseInt(b.metadata?.order || '999');
    return orderA - orderB;
  });

  // Normalize currentPlanId to handle undefined/null
  const effectiveCurrentPlanId = currentPlanId || '';

  const currentPlan =
    sortedPlans.find((p) => p.id === effectiveCurrentPlanId) ||
    (effectiveCurrentPlanId === ''
      ? sortedPlans.find((p) => p.prices.some((pr) => pr.unitAmount === 0))
      : null);
  const currentPrice = currentPlan ? Math.min(...currentPlan.prices.map((p) => p.unitAmount)) : 0;

  const upgrades = sortedPlans.filter((p) => {
    if (p.name.toLowerCase() === 'enterprise') return false;
    if (p.metadata?.type && p.metadata.type !== 'plan') return false;
    const pPrice = Math.min(...p.prices.map((pr) => pr.unitAmount));
    return pPrice > currentPrice;
  });

  const cheaperPlans = sortedPlans.filter((p) => {
    if (p.name.toLowerCase() === 'enterprise') return false;
    if (p.metadata?.type && p.metadata.type !== 'plan') return false;

    const pPrice = Math.min(...p.prices.map((pr) => pr.unitAmount));
    const isFreePlan = pPrice === 0 || p.name.toLowerCase().includes('free');
    const isUserOnFree = !effectiveCurrentPlanId || currentPrice === 0;

    // Don't show current plan or free plan (if already on free) as "cheaper"
    if (p.id === effectiveCurrentPlanId) return false;
    if (isUserOnFree && isFreePlan) return false;

    return pPrice <= currentPrice;
  });

  const enterprisePlan = sortedPlans.find((p) => p.name.toLowerCase() === 'enterprise');

  // Only show the "See Cheaper Plans" divider/toggle if there are actually cheaper plans to show
  const showOthersSection = cheaperPlans.length > 0;

  const getPlanPrice = (plan: Plan) => {
    const price = plan.prices.find((p) => p.interval === billingCycle);
    if (!price) return null;
    return {
      formatted: `$${price.unitAmount / 100}`,
      lookupKey: price.lookupKey,
      unitAmount: price.unitAmount,
    };
  };

  return (
    <div className="flex flex-col items-center gap-10 w-full">
      {/* Billing Cycle Toggle */}
      <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setBillingCycle('month')}
          className={cn(
            'px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200',
            billingCycle === 'month'
              ? 'bg-blue-400 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('year')}
          className={cn(
            'px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2',
            billingCycle === 'year'
              ? 'bg-blue-400 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          Annual
          <span
            className={cn(
              'text-[9px] px-1.5 py-0.5 rounded font-bold tracking-tight',
              billingCycle === 'year'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            )}
          >
            -33%
          </span>
        </button>
      </div>

      <div className="w-full space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Upgrade your plan
        </h2>

        {/* Upgrades List (Shown by default) */}
        <div className="space-y-4">
          {upgrades.map((plan) => {
            const priceData = getPlanPrice(plan);
            return (
              <Card
                key={plan.id}
                className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-full md:w-1/4 space-y-1 text-center md:text-left">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {plan.name}
                  </h4>
                  {priceData && (
                    <p className="text-xs font-medium text-slate-400">
                      {priceData.formatted} USD/mo billed{' '}
                      {billingCycle === 'month' ? 'monthly' : 'annually'}
                    </p>
                  )}
                </div>

                <div className="flex-1 hidden md:flex md:flex-row justify-center md:justify-start gap-x-12 gap-y-2 px-8 border-x border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        AI Credits
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {plan.metadata?.credits
                          ? Number(plan.metadata.credits).toLocaleString()
                          : '10,000'}{' '}
                        Credits
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Storage
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {plan.metadata?.storage_gb ? `${plan.metadata.storage_gb} GB` : '100 GB'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-2 shrink-0">
                  <Button
                    variant="default"
                    onClick={() => priceData && !isProcessing && onSelectPlan(priceData.lookupKey)}
                    disabled={isProcessing || !priceData}
                    className="bg-blue-400 hover:bg-blue-500 font-bold text-white px-8 h-12 rounded-xl"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Started'}
                  </Button>
                  <button className="text-[11px] font-medium text-blue-400 hover:underline">
                    See all benefits
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Enterprise Highlight Card (Horizontal) */}
        {enterprisePlan && (
          <Card className="rounded-xl border-none bg-blue-400 text-white shadow-md shadow-blue-500/10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <div className="p-8 flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
              <div className="w-full lg:w-1/4 space-y-1 text-center lg:text-left">
                <h3 className="text-2xl font-bold leading-tight tracking-tight">
                  {enterprisePlan.name}
                </h3>
                <p className="text-sm font-medium text-blue-50/80">
                  From {getPlanPrice(enterprisePlan)?.formatted || 'Custom'} USD/mo
                </p>
              </div>

              <div className="flex-1 flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-3">
                {enterprisePlan.features
                  ?.filter(
                    (f) =>
                      !f.toLowerCase().includes('user') && !f.toLowerCase().includes('retention')
                  )
                  .slice(0, 3)
                  .map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-medium text-white">
                      <Check className="h-4 w-4 text-white/70" />
                      {feature}
                    </div>
                  ))}
              </div>

              <div className="w-full lg:w-auto flex flex-col items-center lg:items-end gap-2 shrink-0">
                <Button
                  variant="secondary"
                  className="rounded-lg py-5 px-8 font-bold bg-white text-blue-400 hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  Book A Demo
                  <ExternalLink className="h-4 w-4 transition-transform" />
                </Button>
                <button className="text-xs font-medium text-blue-50 hover:underline">
                  See all benefits
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Collapsible Lower-Tier Plans */}
        {showOthersSection && (
          <div className="pt-4">
            <button
              onClick={() => setShowAdditionalPlans(!showAdditionalPlans)}
              className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors mb-4"
            >
              {showAdditionalPlans ? 'Hide' : 'See More Plans'}
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-300',
                  showAdditionalPlans ? 'rotate-180' : ''
                )}
              />
            </button>

            {showAdditionalPlans && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                {cheaperPlans.map((plan) => {
                  const priceData = getPlanPrice(plan);
                  const isCurrent =
                    plan.id === effectiveCurrentPlanId ||
                    (currentPlanId === '' && plan.name.toLowerCase().includes('free'));

                  // Extract AI and Storage benefits specifically
                  const aiBenefit =
                    plan.metadata?.ai_limit ||
                    plan.features?.find((f) => f.toLowerCase().includes('ai')) ||
                    '100 AI Credits';
                  const storageBenefit =
                    plan.metadata?.storage_limit ||
                    plan.features?.find((f) => f.toLowerCase().includes('storage')) ||
                    '512 MB Storage';

                  return (
                    <Card
                      key={plan.id}
                      className={cn(
                        'rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm transition-all',
                        isCurrent &&
                          'border-blue-200 dark:border-blue-700 bg-blue-50/20 dark:bg-blue-900/10'
                      )}
                    >
                      <div className="w-full md:w-1/4 space-y-1 text-center md:text-left">
                        <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                          {plan.name}
                        </h4>
                        {priceData && (
                          <p className="text-xs font-medium text-slate-400">
                            {priceData.formatted} USD/mo billed monthly
                          </p>
                        )}
                      </div>

                      <div className="flex-1 hidden md:flex md:flex-row justify-center md:justify-start gap-x-12 gap-y-2 px-8 border-x border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              AI Credits
                            </p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {plan.metadata?.credits
                                ? `${Number(plan.metadata.credits).toLocaleString()} Credits`
                                : aiBenefit}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <HardDrive className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Storage
                            </p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {plan.metadata?.storage_gb
                                ? `${plan.metadata.storage_gb} GB`
                                : storageBenefit}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-2 shrink-0">
                        {isCurrent ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold uppercase text-blue-400 border-blue-200 bg-blue-50/50 px-4 py-1.5 rounded-full"
                          >
                            Current Plan
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() =>
                              priceData && !isProcessing && onSelectPlan(priceData.lookupKey)
                            }
                            disabled={isProcessing || !priceData}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 px-6 rounded-xl"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Downgrade'
                            )}
                          </Button>
                        )}
                        <button className="text-[11px] font-medium text-blue-400 hover:underline">
                          See all benefits
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
