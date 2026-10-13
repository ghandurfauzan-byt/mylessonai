// src/pages/KuisAdaptifPage.tsx — padanan app/dashboard/pelajar/kuis/page.tsx.
//
// Dulu ASYNC Server Component yang meng-await getQuestionsByLevel(1) DI
// SERVER sebelum mengirim HTML pertama (pola hybrid: server untuk initial
// data, client untuk interaktivitas). Vite SPA tidak punya server yang
// merender halaman, sehingga pre-fetch level 1 kini terjadi di dalam
// QuizClient sendiri via useQuizQuestionsQuery(1) (TanStack Query) — soal
// pertama tampil setelah skeleton loading singkat, bukan langsung di initial
// paint. Trade-off ini didokumentasikan di README.md § Migrasi.

// src/views/KuisAdaptifPage.tsx — padanan app/dashboard/pelajar/kuis/page.tsx.

import QuizClient from "@/components/QuizClient";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function KuisAdaptifPage() {
  useDocumentTitle("Kuis Adaptif Seru — PKn & Bahasa Jawa");
  return <QuizClient />;
}
