import { clsx } from "clsx";

const variants = {
  primary: "bg-accent text-slate-900 hover:bg-sky-300",
  secondary: "bg-slate-800 text-white hover:bg-slate-700",
  outline: "border border-slate-700 text-slate-200 hover:bg-slate-800",
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