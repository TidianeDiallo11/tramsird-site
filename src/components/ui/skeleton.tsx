import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "skeleton relative overflow-hidden rounded-lg bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
