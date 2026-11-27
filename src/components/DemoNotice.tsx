"use client";

import { getRepo } from "@/lib/data";

export function DemoNotice() {
  if (getRepo().mode !== "demo") return null;
  return (
    <p className="rounded-xl bg-accent-soft px-4 py-3 text-xs leading-relaxed text-accent-ink">
      <strong>Mode demo.</strong> Data tersimpan di browser ini saja. Mahasiswa yang ditandai <em>Contoh</em> adalah
      tokoh fiktif yang membalas otomatis.
    </p>
  );
}
