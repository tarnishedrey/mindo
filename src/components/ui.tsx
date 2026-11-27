"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-strong disabled:bg-brand/50",
  secondary: "bg-surface text-ink border border-line hover:border-brand hover:text-brand disabled:opacity-50",
  ghost: "text-brand hover:bg-brand-soft disabled:opacity-50",
  danger: "bg-surface text-danger border border-line hover:border-danger disabled:opacity-50",
};

type Size = "md" | "sm" | "icon";
const sizes: Record<Size, string> = {
  md: "h-12 px-5 text-sm",
  sm: "h-10 px-4 text-[13px]",
  icon: "h-10 w-10 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; block?: boolean }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed",
        sizes[size],
        variants[variant],
        block && "w-full",
        className,
      )}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  block,
  children,
}: {
  href: string;
  variant?: Variant;
  block?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors",
        variants[variant],
        block && "w-full",
      )}
    >
      {children}
    </Link>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-faint outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputClass, "h-12", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputClass, "min-h-24 py-3", props.className)} />;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-[var(--radius-card)] border border-line bg-surface p-4", className)}>{children}</div>;
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "border-brand bg-brand text-white" : "border-line bg-surface text-muted hover:border-brand hover:text-brand",
      )}
    >
      {children}
    </button>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "accent" | "ok" }) {
  const tones = {
    neutral: "border border-line bg-surface text-muted",
    brand: "bg-brand-soft text-brand-strong",
    accent: "bg-accent-soft text-accent-ink",
    ok: "bg-ok-soft text-ok",
  };
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

const avatarColors = ["#3b5bdb", "#12805c", "#b4501b", "#7c3aed", "#0f766e", "#be185d", "#4d7c0f"];

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36, background: avatarColors[hash % avatarColors.length] }}
    >
      {initials || "?"}
    </div>
  );
}

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Kecocokan ${score}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-accent-soft)" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[15px] font-bold text-ink">{score}</span>
        <span className="text-[9px] font-medium text-muted">% cocok</span>
      </div>
    </div>
  );
}

export function Spinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-soft border-t-brand" />
      {label}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
      {children}
    </p>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export { cx };
