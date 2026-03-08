'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { uploadApi } from '@/lib/api/upload';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';

interface ProfileFormState {
  name: string;
  school: string;
  avatar: string;
}

export function ProfilePageContent() {
  const { user, accessToken, setAuth } = useAuth();
  const { t } = useT();

  const [form, setForm] = useState<ProfileFormState>({
    name: user?.name ?? '',
    school: user?.school ?? '',
    avatar: user?.avatar ?? '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pwForm, setPwForm] = useState({ password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const ROLE_LABEL = user?.role === 'teacher' ? t('user.role.teacher') : t('user.role.student');

  const updateMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = form.avatar;
      if (avatarFile) {
        avatarUrl = await uploadApi.uploadImage(avatarFile);
      }
      await authApi.updateProfile(user!._id, {
        name: form.name,
        school: form.school,
        avatar: avatarUrl,
      });
      return avatarUrl;
    },
    onSuccess: (avatarUrl) => {
      const updated = { ...user!, name: form.name, school: form.school, avatar: avatarUrl };
      setAuth(updated, accessToken!);
      setForm((f) => ({ ...f, avatar: avatarUrl }));
      setAvatarPreview(null);
      setAvatarFile(null);
      setProfileMsg(t('profile.updateSuccess'));
      setTimeout(() => setProfileMsg(''), 3000);
    },
  });

  const pwMutation = useMutation({
    mutationFn: () => authApi.changePassword(user!.email, pwForm.password),
    onSuccess: () => {
      setPwMsg(t('profile.passwordSuccess'));
      setPwForm({ password: '', confirmPassword: '' });
      setTimeout(() => setPwMsg(''), 3000);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.password.length < 6) {
      setPwError(t('profile.passwordMinLength'));
      return;
    }
    if (pwForm.password !== pwForm.confirmPassword) {
      setPwError(t('profile.passwordMismatch'));
      return;
    }
    pwMutation.mutate();
  };

  const displayAvatar = avatarPreview ?? form.avatar;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">{t('profile.title')}</h1>

      {/* Profile info card */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="avatar"
                className="h-20 w-20 rounded-full object-cover border-2 border-white shadow"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-neutral-200 flex items-center justify-center text-2xl font-bold text-neutral-500">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-primary text-white p-1.5 shadow border-2 border-white hover:bg-primary/90 transition-colors"
              aria-label={t('profile.changeAvatar')}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-sm text-muted-foreground">
              {ROLE_LABEL} · {user?.userCode}
            </p>
          </div>
        </div>

        {/* Read-only fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">{t('profile.emailLabel')}</Label>
            <p className="text-sm mt-1 font-medium">{user?.email}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t('profile.codeLabel')}</Label>
            <p className="text-sm mt-1 font-medium">{user?.userCode}</p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t('profile.displayNameLabel')}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="school">{t('profile.schoolLabel')}</Label>
            <Input
              id="school"
              value={form.school}
              onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>

        {profileMsg && <p className="text-sm text-green-600 font-medium">{profileMsg}</p>}
        {updateMutation.isError && (
          <p className="text-sm text-destructive">{t('profile.updateFailed')}</p>
        )}

        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t('profile.saveBtn')}
        </Button>
      </div>

      {/* Change password card */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 p-6">
        <h2 className="text-sm font-semibold mb-4">{t('profile.changePasswordTitle')}</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-pw">{t('profile.newPasswordLabel')}</Label>
            <div className="relative mt-1">
              <Input
                id="new-pw"
                type={showPw ? 'text' : 'password'}
                value={pwForm.password}
                onChange={(e) => setPwForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPw ? t('profile.hidePassword') : t('profile.showPassword')}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirm-pw">{t('profile.confirmPasswordLabel')}</Label>
            <Input
              id="confirm-pw"
              type={showPw ? 'text' : 'password'}
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              autoComplete="new-password"
              className="mt-1"
            />
          </div>

          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          {pwMsg && <p className="text-sm text-green-600 font-medium">{pwMsg}</p>}
          {pwMutation.isError && (
            <p className="text-sm text-destructive">Đổi mật khẩu thất bại. Vui lòng thử lại.</p>
          )}

          <Button
            type="submit"
            variant="outline"
            disabled={pwMutation.isPending}
            className="w-full"
          >
            {pwMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Đổi mật khẩu
          </Button>
        </form>
      </div>
    </div>
  );
}
