// src/components/InviteTeacherModal.tsx
//
// Fitur Khusus Guru: Mengundang & Menambahkan Akun Guru Lain ke Sistem.
// Memungkinkan pengajar aktif mendaftarkan rekan guru baru dengan kredensial resmi.

import { playClickSound } from "@/lib/soundEffects";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface TeacherItem {
  id: string;
  name: string;
  email: string;
  nimNip?: string;
  institution?: string;
}

export default function InviteTeacherModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("guru123");
  const [nimNip, setNimNip] = useState("");
  const [institution, setInstitution] = useState("SD Negeri 1 Madiun");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Ambil daftar seluruh guru terdaftar
  const { data: teachers = [], refetch } = useQuery<TeacherItem[]>({
    queryKey: ["teachers-list"],
    queryFn: async () => {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error("Gagal mengambil data guru");
      return res.json();
    },
    enabled: isOpen,
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      nimNip?: string;
      institution?: string;
    }) => {
      const res = await fetch("/api/teachers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengundang guru");
      }
      return json;
    },
    onSuccess: (res) => {
      setSuccessMsg(`Guru ${res.teacher?.name || name} berhasil didaftarkan!`);
      setName("");
      setEmail("");
      setPassword("guru123");
      setNimNip("");
      setErrorMsg(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["teachers-list"] });
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      setSuccessMsg(null);
    },
  });

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Nama lengkap guru wajib diisi.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Alamat email guru tidak valid.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    inviteMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      nimNip: nimNip.trim() || undefined,
      institution: institution.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-900 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Colorful top bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xl font-bold shadow-xs">
              👨‍🏫
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Undang &amp; Tambah Guru Baru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Daftarkan rekan sejawat pengajar SD Negeri 1 Madiun
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="overflow-y-auto py-4 space-y-5 pr-1 text-slate-800 dark:text-slate-200">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <p>{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <span>✅</span>
              <p>{successMsg}</p>
            </div>
          )}

          {/* Form Tambah Guru */}
          <form onSubmit={handleSubmit} className="space-y-3 bg-purple-50/60 dark:bg-slate-800/40 p-4 rounded-2xl border border-purple-100 dark:border-slate-700">
            <h3 className="text-xs font-black text-purple-950 dark:text-purple-300 uppercase tracking-wider">
              Formulir Akun Guru Baru
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap &amp; Gelar *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ibu Ratna Dewi, S.Pd."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Email Guru *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ratna.guru@gmail.com"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi Awal *
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="guru123"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  NIP / NUPTK (Opsional)
                </label>
                <input
                  type="text"
                  value={nimNip}
                  onChange={(e) => setNimNip(e.target.value)}
                  placeholder="198704152010012005"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Satuan Pendidikan / Sekolah
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="SD Negeri 1 Madiun"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{inviteMutation.isPending ? "⏳ Menyimpan..." : "➕ Simpan & Terbitkan Akun Guru"}</span>
            </button>
          </form>

          {/* Daftar Guru yang Sudah Terdaftar */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Daftar Guru Terdaftar ({teachers.length})</span>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Aktif di Sistem</span>
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {teachers.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>👨‍🏫</span>
                      <span>{t.name}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.email} • {t.nimNip || "NIP Belum Diisi"}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
