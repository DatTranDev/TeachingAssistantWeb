'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/lib/api/billing';
import { queryKeys } from '@/lib/api/queryKeys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/hooks/use-t';

interface InvoiceHistoryProps {
  userId: string;
}

export function InvoiceHistory({ userId }: InvoiceHistoryProps) {
  const { locale } = useT();
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';

  const { data: invoices, isLoading } = useQuery({
    queryKey: queryKeys.billing.invoices(userId),
    queryFn: () => billingApi.listInvoices(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-slate-400 text-sm">No invoices found yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
          <tr>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 font-medium">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-slate-600">
                {new Date(inv.created * 1000).toLocaleDateString(localeTag, {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                })}
              </td>
              <td className="px-6 py-4 text-slate-900">
                {(inv.total / 100).toLocaleString(localeTag, {
                  style: 'currency',
                  currency: inv.currency,
                })}
              </td>
              <td className="px-6 py-4">
                <Badge
                  variant="outline"
                  className={`
                    capitalize text-[10px] 
                    ${inv.status === 'paid' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'}
                  `}
                >
                  {inv.status}
                </Badge>
              </td>
              <td className="px-6 py-4 text-right">
                <a
                  href={inv.hosted_invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
