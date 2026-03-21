'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Database, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/lib/api/billing';
import { Loader2 } from 'lucide-react';

interface AddonPack {
  id: string; // Product ID
  name: string;
  price: number;
  description: string;
  lookupKey: string;
}

interface AddonCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'ai' | 'storage';
}

export function AddonCheckoutModal({ isOpen, onClose, type }: AddonCheckoutModalProps) {
  const router = useRouter();
  const [selectedPackId, setSelectedPackId] = useState<string>('');

  const { data: plans, isLoading } = useQuery({
    queryKey: ['billing', 'addons'],
    queryFn: () => billingApi.getAddons(),
  });

  const packs: AddonPack[] = React.useMemo(() => {
    if (!plans) return [];

    const typeMetadataMatch = type === 'ai' ? 'addon_ai' : 'addon_storage';
    const filteredPlans = plans.filter((p) => p.metadata.type === typeMetadataMatch);

    return filteredPlans
      .flatMap((plan) =>
        plan.prices.map((price) => {
          // Prefer price-level nickname/metadata, fallback to plan level
          const name = price.nickname || plan.name;
          const description = price.metadata?.description || plan.description || '';

          // For AI: try to get credits from price metadata, then plan metadata
          let amount = 0;
          if (type === 'ai') {
            amount = parseInt(price.metadata?.credits || plan.metadata.credits || '0');
          } else {
            // For Storage: try to get GB from price metadata, then plan metadata
            amount = parseInt(price.metadata?.storage_gb || plan.metadata.storage_gb || '0');
          }

          return {
            id: price.id,
            name: name,
            description: description,
            price: price.unitAmount / 100,
            currency: price.currency.toUpperCase(),
            credits: amount,
            lookupKey: price.lookupKey,
          };
        })
      )
      .sort((a, b) => a.price - b.price); // Sort by price ascending
  }, [plans, type]);

  React.useEffect(() => {
    if (packs.length > 0 && !selectedPackId) {
      setSelectedPackId(packs[0]!.id);
    }
  }, [packs, selectedPackId]);

  const selectedPack = packs.find((p) => p.id === selectedPackId);

  const handleContinue = () => {
    if (selectedPack) {
      router.push(`/checkout?type=addon&lookupKey=${selectedPack.lookupKey}`);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-8 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                'p-2 rounded-xl',
                type === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
              )}
            >
              {type === 'ai' ? <Zap className="h-5 w-5" /> : <Database className="h-5 w-5" />}
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">
              Buy {type === 'ai' ? 'AI Credit' : 'File Storage'} Packs
            </DialogTitle>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Choose the pack that best fits your needs. {type === 'ai' ? 'Credits' : 'Storage'} will
            be added to your account instantly.
          </p>
        </DialogHeader>

        <div className="p-8 space-y-4">
          <div className="grid gap-3 min-h-[200px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
                <p className="text-sm font-medium">Fetching available packs...</p>
              </div>
            ) : packs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-sm font-medium">No packs available at the moment.</p>
              </div>
            ) : (
              packs.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  className={cn(
                    'flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left group',
                    selectedPackId === pack.id
                      ? 'border-blue-500 bg-blue-50/30 shadow-md shadow-blue-500/5'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                        selectedPackId === pack.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-200'
                      )}
                    >
                      {selectedPackId === pack.id && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {pack.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">{pack.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-lg text-slate-900">${pack.price}</span>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                      {type === 'ai' ? 'One-time' : '/ month'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* FAQ Section */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <h5 className="font-bold text-sm text-slate-900 mb-1">
                  Purchased {type === 'ai' ? 'AI credits' : 'Storage'} roll over
                </h5>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {type === 'ai'
                    ? "All purchased AI credits are added to your balance and can be carried over month to month, meaning they'll never expire as long as you have an active account."
                    : 'Storage add-ons extend your monthly capacity. You can upgrade, downgrade, or cancel your storage add-on at any time.'}
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full h-14 text-lg font-black rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200"
          >
            Continue to Checkout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
