// src/hooks/useDocumentTitle.ts
//
// Padanan ringan dari Metadata API Next.js (`export const metadata` /
// `generateMetadata()`) yang dipakai di setiap app/**/page.tsx pada Tugas 7.
// Vite SPA tidak me-render apa pun di server, sehingga tidak ada cara mengirim
// <title> yang SUDAH benar di HTML pertama (SEO statis sesungguhnya menjadi
// tanggung jawab langkah SSR/prerendering terpisah, di luar cakupan Modul 8).
// Untuk tetap memenuhi kebutuhan FUNGSIONAL "judul tab browser berubah sesuai
// halaman/pilihan pengguna" (termasuk kasus dinamis pada Dashboard Pelajar),
// hook kecil ini menuliskan document.title secara imperatif via useEffect —
// satu-satunya cara yang tersedia di Client Component/SPA murni.

import { useEffect } from "react";

const SITE_NAME = "ExplainMyLesson AI";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
