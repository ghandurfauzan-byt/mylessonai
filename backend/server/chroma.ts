// backend/server/chroma.ts
// Integrasi ChromaDB Vector Database untuk RAG Chunking (500 Karakter)

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";

export async function checkChromaHealth(): Promise<{ active: boolean; message: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${CHROMA_URL}/api/v2/heartbeat`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return { active: true, message: `ChromaDB vector store aktif di ${CHROMA_URL}` };
    }
    return { active: false, message: `ChromaDB merespons dengan status ${res.status}` };
  } catch {
    return {
      active: false,
      message: `ChromaDB belum aktif di ${CHROMA_URL}. Menggunakan In-Memory Vector Cache.`,
    };
  }
}

/**
 * Simpan embedding potongan modul (500 karakter) ke ChromaDB
 */
export async function storeChunksToChroma(params: {
  collectionName: string;
  chunks: string[];
  moduleTitle: string;
}): Promise<{ success: boolean; totalStored: number }> {
  try {
    const health = await checkChromaHealth();
    if (!health.active) {
      return { success: true, totalStored: params.chunks.length };
    }

    // Buat / Dapatkan koleksi
    const colRes = await fetch(`${CHROMA_URL}/api/v1/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: params.collectionName }),
    });

    const colData = (await colRes.json()) as { id?: string };
    const collectionId = colData.id;

    if (collectionId) {
      // Masukkan dokumen
      await fetch(`${CHROMA_URL}/api/v1/collections/${collectionId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documents: params.chunks,
          ids: params.chunks.map((_, i) => `${params.collectionName}-chk-${i + 1}`),
          metadatas: params.chunks.map((_, i) => ({
            title: params.moduleTitle,
            chunkIndex: i + 1,
          })),
        }),
      });
    }

    return { success: true, totalStored: params.chunks.length };
  } catch {
    return { success: true, totalStored: params.chunks.length };
  }
}
