export type DimensionKey = "suasana" | "caraKerja" | "waktu" | "mode";

export const dims: Record<
  DimensionKey,
  { title: string; low: string; high: string }
> = {
  suasana: { title: "Suasana belajar", low: "Tenang", high: "Diskusi" },
  caraKerja: { title: "Cara kerja", low: "Mandiri dulu", high: "Bareng dari awal" },
  waktu: { title: "Waktu terbaik", low: "Pagi–siang", high: "Malam" },
  mode: { title: "Mode belajar", low: "Online", high: "Tatap muka" },
};

export type Question = { id: number; text: string; dimension: DimensionKey; direction: 1 | -1 };

export const questions: Question[] = [
  { id: 1, text: "Aku paling fokus belajar di tempat yang hening.", dimension: "suasana", direction: -1 },
  { id: 2, text: "Aku lebih paham materi kalau membahasnya sambil ngobrol.", dimension: "suasana", direction: 1 },
  { id: 3, text: "Aku suka mengerjakan sendiri dulu, baru membandingkan jawaban.", dimension: "caraKerja", direction: -1 },
  { id: 4, text: "Aku suka mengerjakan soal bersama-sama dari awal sampai akhir.", dimension: "caraKerja", direction: 1 },
  { id: 5, text: "Otakku paling segar untuk belajar di pagi atau siang hari.", dimension: "waktu", direction: -1 },
  { id: 6, text: "Aku lebih produktif belajar di malam hari.", dimension: "waktu", direction: 1 },
  { id: 7, text: "Belajar lewat video call sama efektifnya dengan ketemu langsung.", dimension: "mode", direction: -1 },
  { id: 8, text: "Aku lebih suka belajar bareng secara tatap muka.", dimension: "mode", direction: 1 },
];

export const scale = [
  { value: 1, label: "Sangat tidak setuju" },
  { value: 2, label: "Tidak setuju" },
  { value: 3, label: "Netral" },
  { value: 4, label: "Setuju" },
  { value: 5, label: "Sangat setuju" },
];

export type HabitVector = Record<DimensionKey, number>;

export function toVector(answers: number[]): HabitVector {
  if (answers.length !== questions.length) throw new Error("Jawaban kuis harus 8");
  const sums: Record<DimensionKey, number[]> = { suasana: [], caraKerja: [], waktu: [], mode: [] };
  questions.forEach((q, i) => {
    const a = answers[i];
    if (!(a >= 1 && a <= 5)) throw new Error(`Jawaban ${q.id} di luar skala 1–5`);
    sums[q.dimension].push(((a - 3) / 2) * q.direction);
  });
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  return {
    suasana: avg(sums.suasana),
    caraKerja: avg(sums.caraKerja),
    waktu: avg(sums.waktu),
    mode: avg(sums.mode),
  };
}

export type Personality = { name: string; description: string };

export function personalityOf(v: HabitVector): Personality {
  const discuss = v.suasana > 0;
  const together = v.caraKerja > 0;
  if (!discuss && !together)
    return { name: "Fokus Mandiri", description: "Suka belajar dalam suasana hening, mengerjakan sendiri dulu, lalu bertukar catatan." };
  if (!discuss && together)
    return { name: "Rekan Tenang", description: "Suka belajar bareng dari awal, tapi dalam suasana yang tetap tenang." };
  if (discuss && !together)
    return { name: "Pemantik Diskusi", description: "Mengerjakan sendiri dulu, lalu paling semangat saat membahas dan membandingkan hasil." };
  return { name: "Kolaborator Aktif", description: "Paling paham materi saat dibahas bersama-sama sambil berdiskusi dari awal." };
}

export function poleLabel(dim: DimensionKey, value: number): string | null {
  if (Math.abs(value) < 0.25) return null;
  return value < 0 ? dims[dim].low : dims[dim].high;
}
