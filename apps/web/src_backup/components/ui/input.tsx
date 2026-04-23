import { clsx } from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={clsx(
      "w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none",
      className
    )}
    {...props}
  />
);