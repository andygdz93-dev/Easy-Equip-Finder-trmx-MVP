import { clsx } from "clsx";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export const Badge = ({ className, ...props }: BadgeProps) => (
  <span
    className={clsx(
      "inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200",
      className
    )}
    {...props}
  />
);