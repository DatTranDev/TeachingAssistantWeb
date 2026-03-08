'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, GraduationCap, BookOpen, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  registerStep1Schema,
  registerStep2Schema,
  type RegisterStep1Values,
  type RegisterStep2Values,
} from '@/lib/validations/auth';
import { ROUTES } from '@/constants/routes';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useT } from '@/hooks/use-t';

type Step = 1 | 2;

interface RoleCardProps {
  role: 'student' | 'teacher';
  selected: boolean;
  onClick: () => void;
}

function RoleCard({ role, selected, onClick }: RoleCardProps) {
  const { t } = useT();
  const isTeacher = role === 'teacher';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:border-primary/50',
        selected
          ? 'border-primary bg-primary/5 dark:bg-primary/10'
          : 'border-border bg-white dark:bg-slate-900'
      )}
      aria-pressed={selected}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-2xl',
          selected ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-slate-700 text-neutral-500'
        )}
      >
        {isTeacher ? <BookOpen className="h-7 w-7" /> : <User className="h-7 w-7" />}
      </div>
      <div className="text-center">
        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
          {isTeacher ? t('register.teacherLabel') : t('register.studentLabel')}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          {isTeacher ? t('register.teacherDesc') : t('register.studentDesc')}
        </p>
      </div>
    </button>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [step1Data, setStep1Data] = useState<RegisterStep1Values | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const { t } = useT();

  const step1Form = useForm<RegisterStep1Values>({
    resolver: zodResolver(registerStep1Schema),
  });

  const step2Form = useForm<RegisterStep2Values>({
    resolver: zodResolver(registerStep2Schema),
  });

  const selectedRole = step2Form.watch('role');

  const onStep1Submit = (values: RegisterStep1Values) => {
    setStep1Data(values);
    setStep(2);
  };

  const onStep2Submit = async (values: RegisterStep2Values) => {
    if (!step1Data) return;
    try {
      const { user, accessToken } = await authApi.register({ ...step1Data, ...values });
      setAuth(user, accessToken);
      router.replace(user.role === 'teacher' ? ROUTES.TEACHER.HOME : ROUTES.STUDENT.HOME);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 409 || error.message.toLowerCase().includes('email')) {
          toast.error(t('register.emailExists'));
        } else {
          toast.error(t('register.registerFailed'));
        }
      } else {
        toast.error(t('register.networkError'));
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white mr-3">
          <GraduationCap className="h-6 w-6" />
        </div>
        <span className="font-bold text-neutral-900 dark:text-neutral-100">
          {t('common.appName')}
        </span>
        <span className="ml-auto text-sm text-neutral-400">
          {t('register.stepIndicator', { step: String(step) })}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
        {t('register.title')}
      </h1>

      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit(onStep1Submit)} noValidate className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              {t('register.nameLabel')}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder={t('register.namePlaceholder')}
              aria-invalid={!!step1Form.formState.errors.name}
              aria-describedby={step1Form.formState.errors.name ? 'name-error' : undefined}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...step1Form.register('name')}
            />
            {step1Form.formState.errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                {step1Form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="reg-email"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              {t('register.emailLabel')}
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="email@example.com"
              aria-invalid={!!step1Form.formState.errors.email}
              aria-describedby={step1Form.formState.errors.email ? 'reg-email-error' : undefined}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...step1Form.register('email')}
            />
            {step1Form.formState.errors.email && (
              <p id="reg-email-error" className="mt-1 text-sm text-red-600" role="alert">
                {step1Form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              {t('register.passwordLabel')}
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('register.passwordPlaceholder')}
                aria-invalid={!!step1Form.formState.errors.password}
                aria-describedby={
                  step1Form.formState.errors.password ? 'reg-password-error' : undefined
                }
                className="w-full rounded-lg border border-border px-3 py-2 pr-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...step1Form.register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('register.hidePassword') : t('register.showPassword')}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {step1Form.formState.errors.password && (
              <p id="reg-password-error" className="mt-1 text-sm text-red-600" role="alert">
                {step1Form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* User Code */}
          <div>
            <label
              htmlFor="userCode"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              {t('register.userCodeLabel')}
            </label>
            <input
              id="userCode"
              type="text"
              placeholder={t('register.userCodePlaceholder')}
              aria-invalid={!!step1Form.formState.errors.userCode}
              aria-describedby={step1Form.formState.errors.userCode ? 'userCode-error' : undefined}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...step1Form.register('userCode')}
            />
            {step1Form.formState.errors.userCode && (
              <p id="userCode-error" className="mt-1 text-sm text-red-600" role="alert">
                {step1Form.formState.errors.userCode.message}
              </p>
            )}
          </div>

          {/* School */}
          <div>
            <label
              htmlFor="school"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              {t('register.schoolLabel')}
            </label>
            <input
              id="school"
              type="text"
              placeholder={t('register.schoolPlaceholder')}
              aria-invalid={!!step1Form.formState.errors.school}
              aria-describedby={step1Form.formState.errors.school ? 'school-error' : undefined}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...step1Form.register('school')}
            />
            {step1Form.formState.errors.school && (
              <p id="school-error" className="mt-1 text-sm text-red-600" role="alert">
                {step1Form.formState.errors.school.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 mt-2"
          >
            {t('register.nextBtn')}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={step2Form.handleSubmit(onStep2Submit)} noValidate>
          <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
            {t('register.roleTitle')}
          </h2>

          <div className="flex gap-3 mb-4">
            {(['teacher', 'student'] as const).map((role) => (
              <RoleCard
                key={role}
                role={role}
                selected={selectedRole === role}
                onClick={() => step2Form.setValue('role', role, { shouldValidate: true })}
              />
            ))}
          </div>

          {step2Form.formState.errors.role && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {step2Form.formState.errors.role.message}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors hover:bg-neutral-50 dark:hover:bg-slate-800"
            >
              {t('register.backBtn')}
            </button>
            <button
              type="submit"
              disabled={step2Form.formState.isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {step2Form.formState.isSubmitting && <Spinner className="h-4 w-4" />}
              {step2Form.formState.isSubmitting
                ? t('register.processingBtn')
                : t('register.registerBtn')}
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {t('register.alreadyAccount')}{' '}
        <Link href={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
          {t('register.signIn')}
        </Link>
      </p>
    </div>
  );
}
