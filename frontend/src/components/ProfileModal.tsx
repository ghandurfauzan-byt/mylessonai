// src/components/ProfileModal.tsx — Lihat & Edit Profil Pengguna (FR-22)
//
// Memungkinkan Pelajar maupun Pengajar melihat serta memperbarui data diri,
// alamat email institusi/pribadi, NIM/NIP, dan kata sandi sesuai FR-22 SKPL.

import { fetchProfile, updateProfile } from "@/lib/api/sessionApi";
import { useUIStore } from "@/lib/store/useUIStore";
import type { UserProfile } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function ProfileModal() {
  const isOpen = useUIStore((s) => s.isProfileModalOpen);
  const closeModal = useUIStore((s) => s.closeProfileModal);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    enabled: isOpen,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nimNip, setNimNip] = useState("");
  const [institution, setInstitution] = useState("");
  const [password, setPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
      setNimNip(profile.nimNip || "");
      setInstitution(profile.institution || "D3 Teknik Informatika Madiun, Sekolah Vokasi UNS");
      setPassword("");
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      setSuccessMsg("Profil berhasil diperbarui!");
      setPassword("");
      setTimeout(() => setSuccessMsg(null), 3500);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Gagal memperbarui profil.");
    },
  });

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Nama lengkap tidak boleh kosong.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Alamat email tidak valid.");
      return;
    }

    mutation.mutate({
      name,
      email,
      nimNip,
      institution,
      password: password || undefined,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
              {profile?.role === "pengajar" ? "DS" : "PL"}
            </div>
            <div>
              <h2
                id="profile-modal-title"
                className="font-black text-slate-900 dark:text-white text-base"
              >
                Profil Pengguna (FR-22)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Informasi akun dan pengaturan identitas sistem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Tutup modal profil"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-500">Memuat profil...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                ✓ {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                ✕ {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Peran Akun</label>
                <input
                  type="text"
                  disabled
                  value={profile?.role === "pengajar" ? "Pengajar / Dosen" : "Pelajar / Mahasiswa"}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {profile?.role === "pengajar" ? "NIP Dosen" : "NIM Mahasiswa"}
                </label>
                <input
                  type="text"
                  value={nimNip}
                  onChange={(e) => setNimNip(e.target.value)}
                  placeholder="Nomor Induk Mahasiswa/Dosen"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Lengkap Anda"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Institusi / Kampus</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Institusi Kampus"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kata Sandi Baru (Kosongkan bila tidak diubah)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-60"
              >
                {mutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
