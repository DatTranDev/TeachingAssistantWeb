'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { OtpInput } from '@/components/ui/otp-input';
import { ROUTES } from '@/constants/routes';
import { Spinner } from '@/components/ui/spinner';
import { authApi } from '@/lib/api/auth';
import { useT } from '@/hooks/use-t';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const { t } = useT();

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    if (!canResend) return;
    try {
      await authApi.sendEmailOtp(email);
      setCountdown(60);
      setCanResend(false);
      toast.success(t('auth.resendOtpSuccess'));
    } catch {
      toast.error(t('auth.resendOtpError'));
    }
  }, [canResend, email]);

  const handleVerify = async () => {
    if (otp.length < 6) {
      toast.error(t('auth.otpRequired'));
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.verifyCode(email, otp);
      router.push(
        `${ROUTES.FORGOT_PASSWORD}/reset?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`
      );
    } catch {
      toast.error(t('auth.otpInvalid'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <ShieldCheck className="h-7 w-7" />
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
        {t('auth.enterOtpTitle')}
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        {t('auth.enterOtpSubtitle')}{' '}
        <span className="font-medium text-neutral-700 dark:text-neutral-300">
          {email || t('auth.enterOtpEmailFallback')}
        </span>
      </p>

      <div className="flex justify-center mb-6">
        <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} />
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={isSubmitting || otp.length < 6}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <Spinner className="h-4 w-4" />}
        {isSubmitting ? t('common.processing') : t('auth.verifyBtn')}
      </button>

      <p className="mt-4 text-center text-sm text-neutral-500">
        {t('auth.noOtpReceived')}{' '}
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="font-semibold text-primary hover:underline"
          >
            {t('auth.resendOtp')}
          </button>
        ) : (
          <span className="text-neutral-400">{t('auth.resendAfter', { s: countdown })}</span>
        )}
      </p>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
