import { describe, expect, it } from "vitest";
import { habitScore, rank, scoreMatch, overlap } from "./matching";
import { personalityOf, toVector } from "./quiz";
import type { Profile } from "./types";

const base: Profile = {
  id: "me", fullName: "Aku", university: "Universitas Brawijaya", city: "Malang", faculty: "", studyProgram: "",
  year: 1, bio: "", courses: ["Kalkulus", "Statistika Dasar"], availability: ["mon-malam", "wed-malam", "sat-pagi"],
  quizAnswers: [5, 1, 5, 1, 1, 5, 1, 5], createdAt: "",
};
const p = (id: string, over: Partial<Profile>): Profile => ({ ...base, id, fullName: id, ...over });

describe("quiz", () => {
  it("maps answers to the poles", () => {
    expect(toVector([5, 1, 5, 1, 1, 5, 1, 5])).toEqual({ suasana: -1, caraKerja: -1, waktu: 1, mode: 1 });
    expect(toVector([3, 3, 3, 3, 3, 3, 3, 3])).toEqual({ suasana: 0, caraKerja: 0, waktu: 0, mode: 0 });
  });
  it("rejects bad input", () => {
    expect(() => toVector([1, 2, 3])).toThrow();
    expect(() => toVector([0, 3, 3, 3, 3, 3, 3, 3])).toThrow();
  });
  it("names personalities", () => {
    expect(personalityOf(toVector([5, 1, 5, 1, 3, 3, 3, 3])).name).toBe("Fokus Mandiri");
    expect(personalityOf(toVector([1, 5, 1, 5, 3, 3, 3, 3])).name).toBe("Kolaborator Aktif");
  });
});

describe("matching", () => {
  it("habit similarity is 1 for identical and 0 for opposite answers", () => {
    expect(habitScore([5, 1, 5, 1, 1, 5, 1, 5], [5, 1, 5, 1, 1, 5, 1, 5])).toBe(1);
    expect(habitScore([5, 1, 5, 1, 1, 5, 1, 5], [1, 5, 1, 5, 5, 1, 5, 1])).toBe(0);
  });
  it("shared items ignore case and duplicates", () => {
    expect(overlap(["Kalkulus", "kalkulus ", "Fisika"], ["KALKULUS"])).toEqual(["Kalkulus"]);
  });
  it("a perfect twin scores 100", () => {
    const r = scoreMatch(base, p("twin", {}))!;
    expect(r.score).toBe(100);
    expect(r.reasons.length).toBeGreaterThan(2);
  });
  it("ranks the better match first and skips people without a quiz", () => {
    const close = p("close", { quizAnswers: [4, 2, 4, 2, 2, 4, 2, 4] });
    const far = p("far", { quizAnswers: [1, 5, 1, 5, 5, 1, 5, 1], availability: [], courses: [] });
    const noQuiz = p("noquiz", { quizAnswers: null });
    const ranked = rank(base, [far, noQuiz, close, base]);
    expect(ranked.map((r) => r.profile.id)).toEqual(["close", "far"]);
    expect(ranked[1].score).toBe(0);
  });
  it("filters by campus and city", () => {
    const otherCampus = p("um", { university: "Universitas Negeri Malang" });
    const otherCity = p("ui", { university: "Universitas Indonesia", city: "Depok" });
    expect(rank(base, [otherCampus, otherCity], "kampus")).toHaveLength(0);
    expect(rank(base, [otherCampus, otherCity], "kota").map((r) => r.profile.id)).toEqual(["um"]);
    expect(rank(base, [otherCampus, otherCity], "semua")).toHaveLength(2);
  });
});
