export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-white dark:via-slate-900 to-blue-50 dark:from-slate-900 dark:to-slate-950 p-4 transition-colors">
      {children}
    </div>
  );
}
