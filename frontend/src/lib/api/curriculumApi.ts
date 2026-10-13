// src/lib/api/curriculumApi.ts — API Client untuk Katalog & Request Modul Kemdikbud / AI
import type { CurriculumModule } from "@/components/CurriculumValidationManager";

export interface RequestCurriculumPayload {
  subject: "pkn" | "bjawa";
  chapterCode: string;
  topicTitle: string;
  learningGoal?: string;
  apiSource: "kemdikbud" | "disdik";
}

export interface CatalogItem {
  id: string;
  title: string;
  publisher: string;
  subject: string;
  grade: string;
  source: string;
  coverImage?: string;
  pdfUrl?: string;
  chaptersCount: number;
}

export async function fetchCurriculumCatalog(): Promise<CatalogItem[]> {
  try {
    const res = await fetch("/api/v1/curriculum/catalog");
    if (!res.ok) throw new Error("Gagal memuat katalog buku resmi.");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("fetchCurriculumCatalog error:", err);
    return [];
  }
}

export async function requestCurriculumModule(
  payload: RequestCurriculumPayload
): Promise<CurriculumModule> {
  const res = await fetch("/api/v1/curriculum/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.message || "Gagal merequest materi dari API.");
  }

  const json = await res.json();
  return json.data;
}

export async function validateCurriculumModule(
  moduleData: CurriculumModule
): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/v1/curriculum/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(moduleData),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.message || "Gagal memvalidasi modul.");
  }

  return res.json();
}

export async function fetchCurriculumModules(): Promise<CurriculumModule[]> {
  try {
    const res = await fetch("/api/v1/curriculum/modules");
    if (!res.ok) throw new Error("Gagal memuat modul tersimpan.");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("fetchCurriculumModules error:", err);
    return [];
  }
}

export async function saveCurriculumModuleApi(
  moduleData: CurriculumModule
): Promise<CurriculumModule> {
  const res = await fetch("/api/v1/curriculum/modules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(moduleData),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.message || "Gagal menyimpan modul.");
  }

  const json = await res.json();
  return json.data;
}

export async function deleteCurriculumModuleApi(
  id: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/v1/curriculum/modules/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.message || "Gagal menghapus modul.");
  }

  return res.json();
}

