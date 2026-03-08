import { Skeleton } from '@/components/ui/skeleton';

export function TimetableCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="border-t pt-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}
