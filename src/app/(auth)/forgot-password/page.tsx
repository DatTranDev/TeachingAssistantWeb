'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/validations/auth';
import { ROUTES } from '@/constants/routes';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/hooks/use-t';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useT();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      await authApi.sendEmailOtp(values.email);
      router.push(`${ROUTES.FORGOT_PASSWORD}/verify?email=${encodeURIComponent(values.email)}`);
    } catch {
      toast.error(t('auth.sendOtpError'));
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <Mail className="h-7 w-7" />
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
        {t('auth.forgotPasswordTitle')}
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        {t('auth.forgotPasswordSubtitle')}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="fp-email"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
          >
            {t('auth.email')}
          </label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            placeholder="email@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'fp-email-error' : undefined}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register('email')}
          />
          {errors.email && (
            <p id="fp-email-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Spinner className="h-4 w-4" />}
          {isSubmitting ? t('common.processing') : t('auth.sendOtpBtn')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
          {t('auth.backToLogin')}
        </Link>
      </p>
    </div>
  );
}
