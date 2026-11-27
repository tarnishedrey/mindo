import { dims, type DimensionKey, type HabitVector } from "@/lib/quiz";

export function HabitBars({ mine, other, otherName }: { mine: HabitVector; other?: HabitVector; otherName?: string }) {
  const pos = (v: number) => `${((v + 1) / 2) * 100}%`;
  return (
    <div className="space-y-4">
      {other && (
        <div className="flex gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border-2 border-white bg-brand shadow" /> Kamu
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rotate-45 rounded-[3px] border-2 border-white bg-accent shadow" /> {otherName ?? "Dia"}
          </span>
        </div>
      )}
      {(Object.keys(dims) as DimensionKey[]).map((d) => (
        <div key={d}>
          <p className="mb-1.5 text-xs font-semibold text-ink">{dims[d].title}</p>
          <div className="relative h-2 rounded-full bg-canvas">
            <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand shadow"
              style={{ left: pos(mine[d]) }}
            />
            {other && (
              <span
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[4px] border-2 border-white bg-accent shadow"
                style={{ left: pos(other[d]) }}
              />
            )}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted">
            <span>{dims[d].low}</span>
            <span>{dims[d].high}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
