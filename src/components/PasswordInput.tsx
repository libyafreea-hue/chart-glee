import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { className = "", ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        ref={ref}
        type={show ? "text" : "password"}
        className={`w-full rounded-xl border border-border bg-card px-4 py-3 pr-11 text-sm outline-none focus:border-primary ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
