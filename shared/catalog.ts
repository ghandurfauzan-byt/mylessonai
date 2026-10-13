// shared/catalog.ts
//
// Katalog statis (bukan hasil query server, tidak ada delay/async) yang
// dipakai baik di klien (ChapterModeSelector, UploadModal) maupun di server
// (server/data.ts, sebagai kunci aiContentLibrary). Persis seperti pada
// Tugas 7 (lib/data.ts): konstanta ini SUDAH dibundel ke klien sejak awal
// karena diimpor langsung oleh Client Component ("use client"), sehingga
// memindahkannya ke shared/ tidak mengubah perilaku apa pun — hanya lokasi.

export type AiMode = "cerita" | "kuis_tantangan";

export const availableChapters = [
  { value: "pkn-sila3", label: "PKn: Bab 1 - Makna Sila Ke-3 Pancasila" },
  { value: "pkn-gotongroyong", label: "PKn: Bab 2 - Gotong Royong di Sekolah" },
  { value: "pkn-norma", label: "PKn: Bab 3 - Norma & Aturan Sekolah" },
  { value: "pkn-bhinneka", label: "PKn: Bab 4 - Bhinneka Tunggal Ika" },
  { value: "bjawa-unggahungguh", label: "B. Jawa: Bab 1 - Unggah-ungguh Basa" },
  { value: "bjawa-punokawan", label: "B. Jawa: Bab 2 - Mengenal Punokawan" },
  { value: "bjawa-pandhawa", label: "B. Jawa: Bab 3 - Pandhawa Lima" },
  { value: "bjawa-aksara", label: "B. Jawa: Bab 4 - Aksara Jawa" },
];

export const aiModes: { value: AiMode; icon: string; label: string }[] = [
  { value: "cerita", icon: "💡", label: "Ringkasan & Pengamalan" },
  { value: "kuis_tantangan", icon: "🎮", label: "Kuis Tantangan Seru" },
];
