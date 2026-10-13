import { describe, expect, it } from "vitest";
import {
  deleteCurriculumModule,
  getAiContent,
  getCurriculumModules,
  saveCurriculumModule,
  setActiveCurriculumState,
} from "../../backend/server/data";

describe("Curriculum Modules Persistence, Deletion & Punokawan Content Verification", () => {
  it("should have initial curriculum modules persisted in memory", async () => {
    const modules = await getCurriculumModules();
    expect(modules.length).toBeGreaterThanOrEqual(4);
    expect(modules.some((m) => m.id === "mod-pkn-sila3")).toBe(true);
    expect(modules.some((m) => m.id === "mod-bjawa-punokawan")).toBe(true);
  });

  it("should save and persist a newly fetched API curriculum module", async () => {
    const newMod = {
      id: "mod-test-save-1",
      title: "Mengenal Tokoh Punokawan Petruk dan Gareng",
      chapterCode: "Bab 4",
      subject: "bjawa" as const,
      subjectLabel: "Basa Jawa (Muatan Lokal)",
      grade: "Kelas 4 SD (Fase B)",
      source: "API SIBI Kemdikbudristek",
      sourceType: "kemdikbud" as const,
      pageCount: 20,
      learningGoal: "Meneladani watak luhur Petruk dan Gareng.",
      isValidated: true,
      isActiveToday: false,
      ragSummary: [
        "Pangertosan: Petruk dedege dhuwur, irunge dawa, watake grapyak lan loman.",
        "Aksi Nyata: Seneng mbantu kanca ing kelas.",
      ],
    };

    const saved = await saveCurriculumModule(newMod);
    expect(saved.id).toBe("mod-test-save-1");

    const all = await getCurriculumModules();
    const found = all.find((m) => m.id === "mod-test-save-1");
    expect(found).toBeDefined();
    expect(found?.title).toBe("Mengenal Tokoh Punokawan Petruk dan Gareng");
  });

  it("should correctly fetch Punokawan AI content without Bharatayuddha war leak", async () => {
    const content = await getAiContent("bjawa-punokawan", "cerita");
    expect(content.title).toContain("Punokawan");
    expect(content.body.some((b) => b.includes("Semar") || b.includes("Petruk"))).toBe(true);
    // Should NOT contain Bharatayuddha or Kurusetra war text
    expect(content.body.some((b) => b.includes("Perang Bharatayuddha"))).toBe(false);
    expect(content.body.some((b) => b.includes("Kurusetra"))).toBe(false);
  });

  it("should delete a curriculum module and persist the removal", async () => {
    const toDeleteId = "mod-test-save-1";
    const deleted = await deleteCurriculumModule(toDeleteId);
    expect(deleted).toBe(true);

    const all = await getCurriculumModules();
    expect(all.some((m) => m.id === toDeleteId)).toBe(false);
  });

  it("should synchronize active curriculum state to student getAiContent immediately", async () => {
    const activeMod = {
      id: "mod-bjawa-unggahungguh",
      title: "Trap-Trapan Unggah-Ungguh Basa marang Bapak/Ibu Guru",
      chapterCode: "Bab 1",
      subject: "bjawa",
      ragSummary: [
        "Pangertosan: Unggah-ungguh basa yaiku tata krama lan tata tertib guneman.",
      ],
    };

    setActiveCurriculumState(activeMod);

    const activeContent = await getAiContent("active", "cerita");
    expect(activeContent.title).toContain("Unggah-Ungguh");
    expect(activeContent.body[0]).toContain("Unggah-ungguh");
  });

  it("should have child-friendly SD language and substantive quiz questions for Nasionalisme", async () => {
    const modules = await getCurriculumModules();
    const nasMod = modules.find((m) => m.id === "mod-pkn-nasionalisme");
    expect(nasMod).toBeDefined();

    // Check friendly SD language (no stiff college academic jargon)
    const summaryText = nasMod?.ragSummary?.join(" ") || "";
    expect(summaryText).toContain("Adik-adik");
    expect(summaryText).not.toContain("Secara konseptual");
    expect(summaryText).not.toContain("character building");
    expect(summaryText).not.toContain("proses pembentukan karakter utama");

    // Check quiz tests actual content (symbols, actions), not learning goal meta-questions
    const q1 = nasMod?.quizQuestions?.[1]?.[0]?.question || "";
    const q2 = nasMod?.quizQuestions?.[1]?.[1]?.question || "";
    expect(q1).toContain("cinta tanah air");
    expect(q2).toContain("Lagu kebangsaan");
    expect(q1).not.toContain("intisari dan pemahaman pokok");
    expect(q2).not.toContain("Mengapa siswa SD perlu mempelajari");
  });
});
