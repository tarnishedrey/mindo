import type { Profile } from "./types";
import { dims, type DimensionKey, toVector } from "./quiz";
import { slotLabel } from "./schedule";

export const weights = { habits: 0.6, schedule: 0.3, courses: 0.1 };

const fullSlots = 3;
const fullCourses = 2;

export type MatchResult = {
  profile: Profile;
  score: number;
  parts: { habits: number; schedule: number; courses: number };
  sharedSlots: string[];
  sharedCourses: string[];
  reasons: string[];
};

export const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function habitScore(a: number[], b: number[]): number {
  const va = toVector(a);
  const vb = toVector(b);
  const keys = Object.keys(va) as DimensionKey[];
  const meanGap = keys.reduce((s, d) => s + Math.abs(va[d] - vb[d]), 0) / keys.length;
  return 1 - meanGap / 2;
}

export function overlap(a: string[], b: string[]): string[] {
  const set = new Set(b.map(normalize));
  const seen = new Set<string>();
  return a.filter((x) => {
    const n = normalize(x);
    if (!set.has(n) || seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

export function scoreMatch(me: Profile, other: Profile): MatchResult | null {
  if (!me.quizAnswers || !other.quizAnswers) return null;

  const habits = habitScore(me.quizAnswers, other.quizAnswers);
  const sharedSlots = overlap(me.availability, other.availability);
  const sharedCourses = overlap(other.courses, me.courses);
  const schedule = Math.min(1, sharedSlots.length / fullSlots);
  const courses = Math.min(1, sharedCourses.length / fullCourses);

  const score = Math.round(
    100 * (weights.habits * habits + weights.schedule * schedule + weights.courses * courses),
  );

  return {
    profile: other,
    score,
    parts: { habits, schedule, courses },
    sharedSlots,
    sharedCourses,
    reasons: explain(me.quizAnswers, other.quizAnswers, sharedSlots, sharedCourses),
  };
}

function explain(a: number[], b: number[], slots: string[], courses: string[]): string[] {
  const va = toVector(a);
  const vb = toVector(b);
  const reasons: string[] = [];
  (Object.keys(va) as DimensionKey[]).forEach((d) => {
    const gap = Math.abs(va[d] - vb[d]);
    const both = (va[d] + vb[d]) / 2;
    if (gap <= 0.5 && Math.abs(both) >= 0.25) {
      const pole = both < 0 ? dims[d].low : dims[d].high;
      reasons.push(`${dims[d].title}: sama-sama ${pole.toLowerCase()}`);
    }
  });
  if (slots.length > 0) {
    const sample = slots.slice(0, 2).map(slotLabel).join(", ");
    reasons.push(`${slots.length} waktu luang sama (${sample}${slots.length > 2 ? ", …" : ""})`);
  }
  if (courses.length > 0) reasons.push(`Sama-sama belajar ${courses.slice(0, 2).join(" & ")}`);
  return reasons;
}

export type Scope = "kampus" | "kota" | "semua";

export function inScope(me: Profile, other: Profile, scope: Scope): boolean {
  if (scope === "kampus") return normalize(me.university) === normalize(other.university);
  if (scope === "kota") return normalize(me.city) === normalize(other.city);
  return true;
}

export function rank(me: Profile, others: Profile[], scope: Scope = "semua"): MatchResult[] {
  return others
    .filter((o) => o.id !== me.id && inScope(me, o, scope))
    .map((o) => scoreMatch(me, o))
    .filter((r): r is MatchResult => r !== null)
    .sort((x, y) => y.score - x.score || x.profile.fullName.localeCompare(y.profile.fullName));
}
