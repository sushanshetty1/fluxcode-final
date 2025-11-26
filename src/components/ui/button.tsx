import { cn } from "~/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
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
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-indigo-600 text-white hover:bg-indigo-700": variant === "default",
          "border border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600": variant === "outline",
          "text-gray-300 hover:bg-gray-700 hover:text-white": variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
        },
        {
          "h-10 px-4 py-2": size === "default",
          "h-8 px-3 text-sm": size === "sm",
          "h-12 px-8": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
