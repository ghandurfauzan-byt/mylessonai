// src/lib/api/materialsApi.ts — tidak berubah dari Tugas 7 selain lokasi impor
// skema (kini dari @shared/schema, bukan @/lib/schema).

import {
  type CreateMaterialInput,
  CreateMaterialSchema,
  type Material,
  MaterialSchema,
  MaterialsResponseSchema,
} from "@shared/schema";

const MATERIALS_URL = "/api/materials";

export async function fetchMaterials(): Promise<Material[]> {
  const response = await fetch(MATERIALS_URL);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Gagal mengambil daftar materi dari server.");
  }
  const rawData = await response.json();
  return MaterialsResponseSchema.parse(rawData);
}

export async function createMaterial(input: CreateMaterialInput): Promise<Material> {
  const payload = CreateMaterialSchema.parse(input);

  const response = await fetch(MATERIALS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawData = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(rawData?.error ?? "Gagal menambah materi baru.");
  }
  return MaterialSchema.parse(rawData);
}
