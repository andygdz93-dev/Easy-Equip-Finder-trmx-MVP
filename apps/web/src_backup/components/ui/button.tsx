import { clsx } from "clsx";

const variants = {
  primary: "bg-[rgb(var(--accent))] text-slate-950 hover:bg-[rgb(var(--accent)/0.85)]",
  secondary: "bg-slate-800 text-white hover:bg-slate-700",
  outline: "border border-[rgb(var(--accent)/0.45)] text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.14)]",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export const Button = ({ variant = "primary", className, ...props }: ButtonProps) => (
  <button
    className={clsx(
      "rounded-full px-4 py-2 text-sm font-semibold transition",
      variants[variant],
      className
    )}
    {...props}
  />
);