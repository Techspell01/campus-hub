import { cn } from "@/lib/utils";

/**
 * Placeholder block.
 *
 * Deliberately shaped like the content it stands in for, rather than a
 * spinner. A spinner says "wait"; a skeleton of the right shape says "this is
 * what is arriving", and the page doesn't visibly reflow when it does.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-lg bg-ink/10 dark:bg-white/10",
        className,
      )}
    />
  );
}

/** A frosted panel with placeholder lines inside — the app's common shape. */
export function SkeletonCard({
  className,
  lines = 2,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div
      className={cn(
        "glass glass-shine relative isolate overflow-hidden rounded-glass p-4",
        className,
      )}
    >
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("mt-2.5 h-3", index === lines - 1 ? "w-1/2" : "w-3/4")}
        />
      ))}
    </div>
  );
}

/**
 * Screen-level fallback used by the route `loading.tsx` files.
 *
 * Next renders this the instant a navigation starts, so the tab responds
 * immediately instead of waiting on a server round trip — which is most of
 * what "fast" means on a phone several thousand miles from the server.
 */
export function PageSkeleton({ hero = true }: { hero?: boolean }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      {hero && (
        <div className="glass glass-shine relative isolate overflow-hidden rounded-glass-lg p-6">
          <Skeleton className="h-5 w-28 rounded-pill" />
          <Skeleton className="mt-4 h-9 w-2/3" />
          <Skeleton className="mt-3 h-3.5 w-1/2" />
          <div className="mt-6 flex gap-3">
            <Skeleton className="h-12 w-36 rounded-pill" />
            <Skeleton className="h-12 w-32 rounded-pill" />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard className="sm:col-span-2 xl:col-span-1" />
      </div>
    </div>
  );
}
