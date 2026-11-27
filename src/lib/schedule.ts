export const days = [
  { key: "mon", short: "Sen", long: "Senin" },
  { key: "tue", short: "Sel", long: "Selasa" },
  { key: "wed", short: "Rab", long: "Rabu" },
  { key: "thu", short: "Kam", long: "Kamis" },
  { key: "fri", short: "Jum", long: "Jumat" },
  { key: "sat", short: "Sab", long: "Sabtu" },
  { key: "sun", short: "Min", long: "Minggu" },
] as const;

export const parts = [
  { key: "pagi", label: "Pagi", hint: "07–11" },
  { key: "siang", label: "Siang", hint: "11–16" },
  { key: "malam", label: "Malam", hint: "18–22" },
] as const;

export const slots: string[] = days.flatMap((d) => parts.map((p) => `${d.key}-${p.key}`));

export function slotLabel(slot: string): string {
  const [d, p] = slot.split("-");
  const day = days.find((x) => x.key === d);
  const part = parts.find((x) => x.key === p);
  return day && part ? `${day.short} ${part.label.toLowerCase()}` : slot;
}
