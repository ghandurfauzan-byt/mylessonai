import { describe, expect, it } from "vitest";
import {
  CreateClassRoomSchema,
  MaterialUploadSchema,
  QuizAnswerSchema,
  RegisterInputSchema,
  RoleSchema,
  UpdateProfileInputSchema,
  isInstitutionalEmail,
} from "../../shared/schema";

describe("Shared Zod Schemas Verification (Bab 5 Strict Type-Safety & Validation)", () => {
  describe("MaterialUploadSchema (FR-04, FR-05, TC-06, TC-07)", () => {
    it("should accept valid PDF upload metadata", () => {
      const valid = {
        title: "Diktat Pemrograman Web Front-End",
        fileName: "modul_kuliah_2026.pdf",
        chapter: "Bab 1 - Web Semantik",
      };
      const result = MaterialUploadSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject non-PDF file extensions (TC-07)", () => {
      const invalid = {
        title: "Diktat Pemrograman Web Front-End",
        fileName: "modul_kuliah.docx",
      };
      const result = MaterialUploadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("Format file harus PDF");
      }
    });

    it("should reject title shorter than 5 characters", () => {
      const invalid = {
        title: "Abc",
        fileName: "valid.pdf",
      };
      const result = MaterialUploadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("QuizAnswerSchema (FR-11, FR-12, FR-13)", () => {
    it("should validate level 1, 2, and 3 answers", () => {
      [1, 2, 3].forEach((level) => {
        const payload = {
          level,
          questionId: "q_101",
          selectedOption: 0,
        };
        const result = QuizAnswerSchema.safeParse(payload);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid quiz level < 1 or > 3", () => {
      const invalidLow = { level: 0, questionId: "q_1", selectedOption: 0 };
      const invalidHigh = { level: 4, questionId: "q_1", selectedOption: 0 };
      expect(QuizAnswerSchema.safeParse(invalidLow).success).toBe(false);
      expect(QuizAnswerSchema.safeParse(invalidHigh).success).toBe(false);
    });
  });

  describe("RegisterInputSchema (FR-01, TC-04)", () => {
    it("should validate complete registration data", () => {
      const payload = {
        name: "Ghandur Fauzan",
        email: "ghandur@gmail.com",
        password: "securePassword123",
        role: "pelajar",
      };
      const result = RegisterInputSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email formatting", () => {
      const invalid = {
        name: "Ghandur Fauzan",
        email: "not-an-email",
        password: "securePassword123",
        role: "pelajar",
      };
      const result = RegisterInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 6 characters", () => {
      const invalid = {
        name: "Ghandur Fauzan",
        email: "ghandur@gmail.com",
        password: "123",
        role: "pelajar",
      };
      const result = RegisterInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("CreateClassRoomSchema (FR-21)", () => {
    it("should accept valid class parameters", () => {
      const payload = {
        name: "Praktikum Pemrograman Front-End 2026",
        code: "TI-FE-2026",
        semester: "Ganjil",
        academicYear: "2025/2026",
      };
      const result = CreateClassRoomSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe("RoleSchema (FR-02)", () => {
    it("should strictly allow only 'pelajar' or 'pengajar'", () => {
      expect(RoleSchema.safeParse("pelajar").success).toBe(true);
      expect(RoleSchema.safeParse("pengajar").success).toBe(true);
      expect(RoleSchema.safeParse("superadmin").success).toBe(false);
      expect(RoleSchema.safeParse("").success).toBe(false);
    });
  });

  describe("isInstitutionalEmail (FR-01, SKPL Institutional Verification)", () => {
    it("should recognize institutional email domains (*.ac.id, *.edu, student/staff UNS)", () => {
      expect(isInstitutionalEmail("ghandur@student.uns.ac.id")).toBe(true);
      expect(isInstitutionalEmail("darmawan@staff.uns.ac.id")).toBe(true);
      expect(isInstitutionalEmail("mahasiswa@ugm.ac.id")).toBe(true);
      expect(isInstitutionalEmail("researcher@mit.edu")).toBe(true);
    });

    it("should identify non-institutional / generic domains as public", () => {
      expect(isInstitutionalEmail("user@gmail.com")).toBe(false);
      expect(isInstitutionalEmail("admin@yahoo.com")).toBe(false);
      expect(isInstitutionalEmail("someone@domain.xyz")).toBe(false);
      expect(isInstitutionalEmail("")).toBe(false);
    });
  });
});
