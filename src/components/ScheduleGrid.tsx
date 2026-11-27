"use client";

import { days, parts } from "@/lib/schedule";
import { cx } from "./ui";

export function ScheduleGrid({
  value,
  onChange,
  highlight,
}: {
  value: string[];
  onChange?: (next: string[]) => void;
  highlight?: string[];
}) {
  const selected = new Set(value);
  const shared = new Set(highlight ?? []);
  const toggle = (slot: string) => {
    if (!onChange) return;
    onChange(selected.has(slot) ? value.filter((s) => s !== slot) : [...value, slot]);
  };

  return (
    <div className="grid grid-cols-[3.25rem_repeat(3,1fr)] gap-1.5">
      <span />
      {parts.map((p) => (
        <span key={p.key} className="pb-1 text-center text-xs font-semibold text-ink">
          {p.label}
          <span className="block text-[10px] font-normal text-muted">{p.hint}</span>
        </span>
      ))}
      {days.map((d) => (
        <div key={d.key} className="contents">
          <span className="flex items-center text-xs font-medium text-muted">{d.short}</span>
          {parts.map((p) => {
            const slot = `${d.key}-${p.key}`;
            const on = selected.has(slot);
            const isShared = shared.has(slot);
            return (
              <button
                key={slot}
                type="button"
                disabled={!onChange}
                onClick={() => toggle(slot)}
                aria-pressed={on}
                aria-label={`${d.long} ${p.label}`}
                className={cx(
                  "h-10 rounded-lg border text-xs font-semibold transition-colors",
                  isShared
                    ? "border-accent bg-accent text-ink"
                    : on
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-surface text-transparent",
                  onChange && !on && "hover:border-brand",
                  !onChange && "cursor-default",
                )}
              >
                {on || isShared ? "✓" : "·"}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
