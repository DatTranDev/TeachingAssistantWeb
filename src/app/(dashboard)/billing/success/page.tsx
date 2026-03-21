'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/hooks/use-t';

export default function SuccessPage() {
  const router = useRouter();
  const { locale } = useT();

  useEffect(() => {
    toast.success(
      locale === 'vi'
        ? 'Thanh toan da duoc xu ly thanh cong!'
        : 'Your payment was processed successfully!'
    );
  }, [locale]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full border-none shadow-2xl animate-in zoom-in-95 duration-500">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {locale === 'vi' ? 'Thanh Toan Thanh Cong!' : 'Payment Successful!'}
          </CardTitle>
          <CardDescription className="text-slate-500 text-base mt-2">
            {locale === 'vi'
              ? 'Cam on ban da mua hang. Tinh nang tai khoan cua ban da duoc cap nhat.'
              : 'Thank you for your purchase. Your account features have been updated.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-6">
          <Button
            className="w-full h-12 text-base font-semibold transition-all hover:translate-x-1"
            onClick={() => router.push('/billing')}
          >
            {locale === 'vi' ? 'Di Den Bang Dieu Khien Thanh Toan' : 'Go to Billing Dashboard'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xs text-center text-slate-400">
            {locale === 'vi'
              ? 'Hoa don xac nhan da duoc gui den email cua ban.'
              : 'A confirmation receipt has been sent to your email.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
