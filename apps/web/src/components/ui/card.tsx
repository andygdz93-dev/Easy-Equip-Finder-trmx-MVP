import { clsx } from "clsx";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={clsx(
      "rounded-2xl border border-slate-800 bg-panel/70 p-6 shadow-lg",
      className
    )}
    {...props}
  />
);