// src/components/ProfileModal.tsx — Profil Siswa & Guru Ramah Anak SD
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
  const [kelas, setKelas] = useState("Kelas 4");
  const [noAbsen, setNoAbsen] = useState("07");
  const [nimNip, setNimNip] = useState("");
  const [institution, setInstitution] = useState("SD Negeri 1 Madiun");
  const [password, setPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPelajar = (profile?.role || "pelajar") === "pelajar";

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
      setKelas(profile.kelas || "Kelas 4");
      setNoAbsen(profile.noAbsen || "07");
      setNimNip(profile.nimNip || "");
      setInstitution(profile.institution || "SD Negeri 1 Madiun");
      setPassword("");
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setSuccessMsg("Data profil berhasil diperbarui!");
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
      setErrorMsg("Nama tidak boleh kosong.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Alamat email tidak valid.");
      return;
    }

    mutation.mutate({
      name: name.trim(),
      email: email.trim(),
      kelas: isPelajar ? kelas : undefined,
      noAbsen: isPelajar ? noAbsen.trim() : undefined,
      nimNip: isPelajar ? `SD-${kelas.replace(/\s+/g, "")}-${noAbsen}` : nimNip,
      institution: institution.trim(),
      password: password || undefined,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${
                isPelajar
                  ? "bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-amber-500/20"
                  : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/20"
              }`}
            >
              {isPelajar ? "🧒" : "👨‍🏫"}
            </div>
            <div>
              <h2 id="profile-modal-title" className="font-black text-slate-900 dark:text-white text-lg">
                {isPelajar ? "Kartu Identitas Siswa" : "Profil Bapak/Ibu Guru"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isPelajar
                  ? "Atur kelas, nomor absen, dan identitas belajarmu"
                  : "Pengaturan identitas pendidik dan pengampu kelas"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Tutup modal profil"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Memuat profil...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Visual Mini Card */}
            <div
              className={`p-4 rounded-2xl border ${
                isPelajar
                  ? "bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-200/80 dark:border-amber-800/40"
                  : "bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200/80 dark:border-blue-800/40"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{isPelajar ? "🎒" : "🏫"}</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {name || "Siswa SD"}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isPelajar
                      ? "bg-amber-500 text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {isPelajar ? `${kelas} • No. Absen ${noAbsen}` : "Wali Kelas & Pendidik"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                <span>{institution || "SD Negeri 1 Madiun"}</span>
                {isPelajar && (
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    🎮 Skor Game: {profile?.gamePoints ?? profile?.points ?? 0} | 📝 Skor Kuis: {(profile as any)?.quizScore ?? (profile?.weakness ? profile.weakness.score * 10 : 90)}
                  </span>
                )}
              </div>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <span>✓</span>
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                <span>✕</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Nama Lengkap */}
            <div>
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
                {isPelajar ? "Nama Lengkap Siswa" : "Nama Lengkap & Gelar Guru"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ghandur Fauzan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Jika Pelajar: Kelas & Nomor Absen */}
            {isPelajar ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
                    Kelas Siswa
                  </label>
                  <select
                    value={kelas.startsWith("Kelas ") ? kelas : `Kelas ${kelas}`}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Kelas 1">Kelas 1</option>
                    <option value="Kelas 2">Kelas 2</option>
                    <option value="Kelas 3">Kelas 3</option>
                    <option value="Kelas 4">Kelas 4</option>
                    <option value="Kelas 5">Kelas 5</option>
                    <option value="Kelas 6">Kelas 6</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Absen
                  </label>
                  <input
                    type="text"
                    value={noAbsen}
                    onChange={(e) => setNoAbsen(e.target.value)}
                    placeholder="Contoh: 07"
                    maxLength={4}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
                  NIP / NUPTK Guru
                </label>
                <input
                  type="text"
                  value={nimNip}
                  onChange={(e) => setNimNip(e.target.value)}
                  placeholder="Nomor Induk Pegawai / NUPTK"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Email & Sekolah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sekolah.sch.id"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
                  Asal Sekolah
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="SD Negeri 1 Madiun"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
                Kata Sandi Baru (Kosongkan bila tidak ingin diganti)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition disabled:opacity-60 cursor-pointer ${
                  isPelajar
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20"
                }`}
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
