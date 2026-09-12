import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-svh items-center justify-center gap-3 p-6">
      <Skeleton className="size-10 rounded-full" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}
