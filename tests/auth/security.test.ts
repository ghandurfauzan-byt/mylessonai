import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { registerUserAccount, verifyUserCredentials } from "../../backend/server/data";

describe("Security Controls & Authentication (NFR-01, TC-01, TC-02, TC-03, TC-05)", () => {
  describe("Bcrypt Password Hashing", () => {
    it("should securely hash plaintext password and verify match", () => {
      const password = "mySecretPassword2026";
      const saltRounds = 10;
      const hash = bcrypt.hashSync(password, saltRounds);

      expect(hash).not.toBe(password);
      expect(bcrypt.compareSync(password, hash)).toBe(true);
      expect(bcrypt.compareSync("wrongPassword", hash)).toBe(false);
    });
  });

  describe("User Credential Verification (TC-01, TC-02, TC-03)", () => {
    it("TC-01: should successfully verify existing demo accounts with valid password", async () => {
      const user = await verifyUserCredentials("ghandur@gmail.com", "secret123");
      expect(user).toBeDefined();
      expect(user.role).toBe("pelajar");
      expect(user.email).toBe("ghandur@gmail.com");
    });

    it("TC-02: should throw error on invalid password", async () => {
      await expect(verifyUserCredentials("ghandur@gmail.com", "wrongPassword")).rejects.toThrow(
        "Email atau kata sandi tidak valid"
      );
    });

    it("TC-03: should throw error on unregistered email", async () => {
      await expect(
        verifyUserCredentials("unknown_user_999@gmail.com", "secret123")
      ).rejects.toThrow("Akun tidak ditemukan");
    });
    it("should successfully verify teacher accounts with valid password", async () => {
      const teacher = await verifyUserCredentials("guru@gmail.com", "guru123");
      expect(teacher).toBeDefined();
      expect(teacher.role).toBe("pengajar");
      expect(teacher.name).toContain("Retno");

      const dosen = await verifyUserCredentials("darmawan@gmail.com", "dosen123");
      expect(dosen).toBeDefined();
      expect(dosen.role).toBe("pengajar");
    });
  });

  describe("Duplicate Email Prevention (TC-05)", () => {
    it("TC-05: should reject registration if email is already registered", async () => {
      await expect(
        registerUserAccount({
          name: "Test Duplicate",
          email: "ghandur@gmail.com", // email sudah ada di usersDb
          password: "password123",
          role: "pelajar",
        })
      ).rejects.toThrow("Email sudah terdaftar");
    });
  });

  describe("Teacher Invitation & Management", () => {
    it("should allow registering invited teacher and retrieve teachers list", async () => {
      const { getRegisteredTeachers } = await import("../../backend/server/data");
      const initialTeachers = await getRegisteredTeachers();
      expect(initialTeachers.length).toBeGreaterThanOrEqual(2);

      const timestamp = Date.now();
      const newTeacher = await registerUserAccount({
        name: `Guru Uji ${timestamp}`,
        email: `guru_uji_${timestamp}@gmail.com`,
        password: "passwordGuru123",
        role: "pengajar",
      });

      expect(newTeacher.id).toBeDefined();
      expect(newTeacher.role).toBe("pengajar");

      const updatedTeachers = await getRegisteredTeachers();
      expect(updatedTeachers.some((t) => t.email === `guru_uji_${timestamp}@gmail.com`)).toBe(true);
    });
  });
});
