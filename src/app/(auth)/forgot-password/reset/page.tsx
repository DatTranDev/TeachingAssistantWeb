'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/validations/auth';
import { ROUTES } from '@/constants/routes';
import { Spinner } from '@/components/ui/spinner';
import { authApi } from '@/lib/api/auth';
import { useT } from '@/hooks/use-t';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const otp = searchParams.get('otp') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useT();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      await authApi.changePassword(email, values.password);
      toast.success(t('auth.resetPasswordSuccess'));
      router.push(ROUTES.LOGIN);
    } catch {
      toast.error(t('auth.resetPasswordError'));
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <KeyRound className="h-7 w-7" />
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
        {t('auth.resetPasswordTitle')}
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        {t('auth.resetPasswordSubtitle')}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* New Password */}
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
          >
            {t('auth.newPasswordLabel')}
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('auth.newPasswordPlaceholder')}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'new-password-error' : undefined}
              className="w-full rounded-lg border border-border px-3 py-2 pr-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="new-password-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
          >
            {t('auth.confirmPasswordLabel')}
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('auth.confirmPasswordPlaceholder')}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              className="w-full rounded-lg border border-border px-3 py-2 pr-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 mt-2"
        >
          {isSubmitting && <Spinner className="h-4 w-4" />}
          {isSubmitting ? t('common.processing') : t('auth.resetPasswordBtn')}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
