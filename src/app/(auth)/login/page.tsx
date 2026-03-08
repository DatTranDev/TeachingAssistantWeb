'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { ROUTES } from '@/constants/routes';
import { Spinner } from '@/components/ui/spinner';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useT } from '@/hooks/use-t';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { user, accessToken } = await authApi.login({
        email: values.email,
        password: values.password,
      });
      setAuth(user, accessToken);
      const redirectTo =
        searchParams.get('redirect') ??
        (user.role === 'teacher' ? ROUTES.TEACHER.HOME : ROUTES.STUDENT.HOME);
      router.replace(redirectTo);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 404) toast.error(t('auth.errors.notFound'));
        else if (error.statusCode === 401) toast.error(t('auth.errors.wrongPassword'));
        else toast.error(t('auth.errors.generic'));
      } else {
        toast.error(t('auth.errors.network'));
      }
    }
  };

  const inputCls =
    'w-full rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-lg dark:shadow-slate-900/50 border border-transparent dark:border-slate-700/50 p-8">
      {/* Language toggle — top right */}
      <div className="flex justify-end mb-4">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white mb-3 shadow-md shadow-primary/30">
          <GraduationCap className="h-8 w-8" />
        </div>
        <span className="text-lg font-bold text-neutral-900 dark:text-slate-100">
          {t('common.appName')}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 dark:text-slate-100 mb-1">
        {t('auth.welcome')}
      </h1>
      <p className="text-sm text-neutral-500 dark:text-slate-400 mb-6">{t('auth.loginSubtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={inputCls}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-slate-300">
              {t('auth.password')}
            </label>
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-primary hover:underline dark:text-blue-400"
              tabIndex={-1}
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder')}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`${inputCls} pr-10`}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 hover:text-neutral-600 dark:hover:text-slate-300 cursor-pointer transition-colors"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 rounded border-border dark:border-slate-600 accent-primary"
            {...register('rememberMe')}
          />
          <label htmlFor="rememberMe" className="text-sm text-neutral-600 dark:text-slate-400">
            {t('auth.rememberMe')}
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 mt-2 cursor-pointer"
        >
          {isSubmitting && <Spinner className="h-4 w-4" />}
          {isSubmitting ? t('auth.signingIn') : t('auth.login')}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border dark:bg-slate-700" />
        <span className="text-xs text-neutral-400 dark:text-slate-500">{t('auth.orLoginWith')}</span>
        <div className="h-px flex-1 bg-border dark:bg-slate-700" />
      </div>

      <button
        type="button"
        disabled
        aria-disabled="true"
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-border dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-neutral-500 dark:text-slate-400 cursor-not-allowed opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </button>

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-slate-400">
        {t('auth.noAccount')}{' '}
        <Link href={ROUTES.REGISTER} className="font-semibold text-primary dark:text-blue-400 hover:underline">
          {t('auth.register')}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
