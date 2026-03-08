import { Skeleton } from '@/components/ui/skeleton';

export function SubjectCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-5 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="border-t pt-3">
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}
