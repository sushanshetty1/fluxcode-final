import { cn } from "~/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "primary" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wide text-sm",
        {
          "bg-primary text-black hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/20": variant === "default",
          "bg-primary text-black hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/20": variant === "primary",
          "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-primary/30": variant === "outline",
          "bg-white/10 text-white border border-white/10 hover:bg-white/20": variant === "secondary",
          "text-white/60 hover:bg-white/5 hover:text-white": variant === "ghost",
          "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20": variant === "destructive",
        },
        {
          "h-11 px-6 py-3": size === "default",
          "h-9 px-4 text-xs": size === "sm",
          "h-14 px-10 text-base": size === "lg",
          "h-10 w-10": size === "icon",
        },
        className
      )}
      {...props}
    />
  );
}
