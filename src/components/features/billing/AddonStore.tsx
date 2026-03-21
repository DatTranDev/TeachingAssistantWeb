import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { billingApi, Plan } from '@/lib/api/billing';
import { Loader2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddonCardProps {
  title: string;
  description: string;
  price: number;
  onBuy: () => void;
  isLoading?: boolean;
}

export const AddonCard: React.FC<AddonCardProps> = ({
  title,
  description,
  price,
  onBuy,
  isLoading,
}) => (
  <Card className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-all">
    <div className="flex-grow pr-4">
      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{title}</h4>
      <p className="text-xs text-slate-400 font-medium">{description}</p>
    </div>
    <div className="flex items-center gap-4 flex-shrink-0">
      <span className="font-black text-sm text-blue-600 dark:text-blue-400">${price}</span>
      <Button
        size="sm"
        onClick={onBuy}
        disabled={isLoading}
        className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white min-w-[70px]"
      >
        Buy
      </Button>
    </div>
  </Card>
);

export const AddonStore: React.FC<{
  onBuyAddon: (lookupKey: string) => void;
  isLoading?: boolean;
}> = ({ onBuyAddon, isLoading }) => {
  const { data: plans, isLoading: isFetching } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => billingApi.getPlans(),
  });

  if (isFetching) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const aiPacks = plans?.filter((p) => p.metadata?.category === 'ai_pack') || [];
  const storageAddons = plans?.filter((p) => p.metadata?.category === 'storage_addon') || [];

  return (
    <div className="space-y-12 mt-4 pb-12">
      {/* AI Packs Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">AI Credit Packs</h3>
        </div>

        {aiPacks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {aiPacks.map((pack) => {
              const price = pack.prices[0];
              if (!price) return null;
              return (
                <AddonCard
                  key={pack.id}
                  title={pack.name}
                  description={pack.description || `${pack.metadata?.credits || '0'} Credits`}
                  price={price.unitAmount / 100}
                  onBuy={() => onBuyAddon(price.lookupKey)}
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-400 font-bold">No credit packs available yet.</p>
          </div>
        )}
      </div>

      {/* Storage Addons Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Storage Add-ons</h3>
        </div>

        {storageAddons.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {storageAddons.map((addon) => {
              const price = addon.prices.find((p) => p.interval === 'month') || addon.prices[0];
              if (!price) return null;
              return (
                <AddonCard
                  key={addon.id}
                  title={addon.name}
                  description={addon.description || `+${addon.metadata?.storage || '0'} GB Monthly`}
                  price={price.unitAmount / 100}
                  onBuy={() => onBuyAddon(price.lookupKey)}
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-400 font-bold">No storage add-ons available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
