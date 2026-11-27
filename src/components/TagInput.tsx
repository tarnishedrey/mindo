"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { normalize } from "@/lib/matching";
import { Input } from "./ui";

const suggestions = [
  "Kalkulus",
  "Statistika Dasar",
  "Aljabar Linear",
  "Algoritma dan Pemrograman",
  "Struktur Data",
  "Matematika Diskrit",
  "Fisika Dasar",
  "Biokimia",
  "Anatomi Fisiologi",
  "Pengantar Akuntansi",
  "Matematika Ekonomi",
];

export function TagInput({ value, onChange, max = 8 }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const [draft, setDraft] = useState("");
  const has = (t: string) => value.some((v) => normalize(v) === normalize(t));

  const add = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (!t || has(t) || value.length >= max) return;
    onChange([...value, t]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  const picks = suggestions.filter((s) => !has(s)).slice(0, 6);

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-soft py-1 pl-3 pr-1.5 text-sm text-brand-strong">
              {t}
              <button type="button" aria-label={`Hapus ${t}`} onClick={() => onChange(value.filter((v) => v !== t))} className="rounded-full p-0.5 hover:bg-white">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => add(draft)}
        placeholder={value.length >= max ? `Maksimal ${max} mata kuliah` : "Ketik lalu tekan Enter"}
        disabled={value.length >= max}
      />
      {picks.length > 0 && value.length < max && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {picks.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-dashed border-line px-3 py-1 text-xs text-muted hover:border-brand hover:text-brand">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
