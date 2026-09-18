import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn, cnControl } from "@/lib/cn";

// ── Button ────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 shadow-sm",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-brand-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-brand-700 focus-visible:outline-brand-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 border-b border-slate-200">
      <div className="min-w-0">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="block text-xs text-slate-500 mt-1">{hint}</span>
      )}
      {error && (
        <span className="block text-xs text-red-600 mt-1">{error}</span>
      )}
    </label>
  );
}

const CONTROL_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 " +
  "placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 " +
  "focus:outline-none disabled:bg-slate-50 disabled:text-slate-500";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cnControl(CONTROL_CLASS, className)} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cnControl(`${CONTROL_CLASS} resize-y`, className)}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cnControl(`${CONTROL_CLASS} pr-8`, className)}>
      {children}
    </select>
  );
}

// ── Badge ─────────────────────────────────────────────────────

type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "brand"
  | "highlight";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  // Hijau limau — status positif (aktif, hari sekolah, komponen menu).
  success: "bg-accent-50 text-accent-800 border-accent-200",
  // Oranye persik — perlu perhatian (libur, nonaktif).
  warning: "bg-highlight-50 text-highlight-800 border-highlight-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  // Ungu tua — penanda struktural (kategori, label admin).
  info: "bg-brand-50 text-brand-700 border-brand-200",
  brand: "bg-brand-600 text-white border-brand-600",
  // Persik lebih tegas — dipakai untuk "Hari ini".
  highlight: "bg-highlight-100 text-highlight-900 border-highlight-300",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2.5 py-0.5 text-xs font-medium",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── States ────────────────────────────────────────────────────

export function Spinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Spinner satu layar penuh — dipakai saat memverifikasi sesi login. */
export function FullPageSpinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <AlertCircle className="w-8 h-8 text-red-500" />
      <p className="text-sm text-slate-600 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center px-6">
      {icon && <div className="text-slate-400">{icon}</div>}
      <div>
        <p className="font-medium text-slate-700">{title}</p>
        {description && (
          <p className="text-sm text-slate-500 mt-1 max-w-md">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-950/45 p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 my-auto">
        <div className="brand-stripe rounded-t-2xl" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-brand-700 text-xl leading-none px-1"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-brand-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
