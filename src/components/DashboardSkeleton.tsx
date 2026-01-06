import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 sm:h-10 sm:w-48" />
          <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
        </div>
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>

      {/* Profile card skeleton */}
      <Card className="border-border/70 bg-card/50 shadow-sm">
        <CardContent className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
          <Skeleton className="h-11 w-11 rounded-full sm:h-12 sm:w-12" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Recent posts card skeleton */}
      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-44" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card/60 px-3 py-2"
            >
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stats cards skeleton */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-border/60 bg-card/60 shadow-sm">
            <CardContent className="px-3 py-3 sm:px-4 sm:py-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All posts table skeleton */}
      <Card className="border-border/70 bg-card/40 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card/40">
            {/* Table header skeleton */}
            <div className="flex items-center gap-4 border-b border-border/60 px-4 py-3">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12 ml-auto" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            {/* Table rows skeleton */}
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-border/40 last:border-0 px-4 py-4"
              >
                <Skeleton className="h-4 w-48 flex-1" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
