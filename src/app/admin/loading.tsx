import { PageSkeleton } from "@/components/ui/Skeleton";

/**
 * Shown the moment a navigation to this route begins, before the server has
 * answered. Next also prefetches this shell for links in view, so the tab
 * responds instantly and the real content streams in behind it.
 */
export default function Loading() {
  return <PageSkeleton hero={false} />;
}
