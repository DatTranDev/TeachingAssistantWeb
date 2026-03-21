'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useT } from '@/hooks/use-t';

export default function CancelPage() {
  const router = useRouter();
  const { locale } = useT();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full border-none shadow-2xl animate-in fade-in-50 duration-500">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center text-rose-600">
            <XCircle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {locale === 'vi' ? 'Da Huy Thanh Toan' : 'Payment Cancelled'}
          </CardTitle>
          <CardDescription className="text-slate-500 text-base mt-2">
            {locale === 'vi'
              ? 'Phien thanh toan da bi huy. Tai khoan cua ban khong bi tinh phi.'
              : 'Your checkout session was cancelled. No charges were made to your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-6">
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={() => router.push('/billing')}
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            {locale === 'vi' ? 'Thu Lai' : 'Try Again'}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-slate-500"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === 'vi' ? 'Ve Trang Chu' : 'Return Home'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
