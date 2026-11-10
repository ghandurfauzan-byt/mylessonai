// src/components/StudentAccountsManager.tsx — Manajemen Kontrol Akun Siswa SD oleh Guru
import ModalPortal from "@/components/ModalPortal";
import { playClickSound, playCorrectSound } from "@/lib/soundEffects";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export interface StudentAccount {
  id: string;
  name: string;
  email: string;
  nimNip?: string;
  institution?: string;
  kelas?: string;
  noAbsen?: string;
  points?: number;
  materialScore?: number;
  quizScore?: number;
  gamePoints?: number;
  weakness?: {
    chapterId: string;
    chapterName: string;
    subject: string;
    score: number;
    outOf: number;
    status: "tuntas" | "remedial";
    message: string;
  };
}

export default function StudentAccountsManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState<string>("all");

  // Modal State: Tambah Siswa Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("siswa123");
  const [newKelas, setNewKelas] = useState("Kelas 4");
  const [newNoAbsen, setNewNoAbsen] = useState("");

  // Modal State: Edit Siswa
  const [editingStudent, setEditingStudent] = useState<StudentAccount | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editKelas, setEditKelas] = useState("Kelas 4");
  const [editNoAbsen, setEditNoAbsen] = useState("");

  // Feedback Messages
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fetch daftar siswa
  const { data: students = [], isLoading } = useQuery<StudentAccount[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Gagal mengambil data siswa.");
      return res.json();
    },
  });

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Mutation: Tambah Siswa
  const addStudentMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password?: string; kelas: string; noAbsen: string }) => {
      const res = await fetch("/api/students/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menambahkan siswa.");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["class-summary"] });
      playCorrectSound();
      showNotice("Akun siswa baru berhasil didaftarkan! 🎒");
      setIsAddModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewNoAbsen("");
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  // Mutation: Update Siswa
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; email: string; kelas: string; noAbsen: string } }) => {
      const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memperbarui data siswa.");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      playCorrectSound();
      showNotice("Data profil siswa berhasil diperbarui! ✏️");
      setEditingStudent(null);
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  // Mutation: Reset Poin Siswa Tertentu
  const resetSinglePointsMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/students/${encodeURIComponent(id)}/reset-points`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal mereset poin siswa.");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      playCorrectSound();
      showNotice("Poin belajar & petualangan game siswa berhasil di-reset ke 0! 🔄");
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  // Mutation: Hapus Siswa
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus siswa.");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["class-summary"] });
      playCorrectSound();
      showNotice("Akun siswa telah dihapus dari kelas. 🗑️");
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  const handleOpenEdit = (s: StudentAccount) => {
    playClickSound();
    setEditingStudent(s);
    setEditName(s.name);
    setEditEmail(s.email);
    setEditKelas(s.kelas || "Kelas 4");
    setEditNoAbsen(s.noAbsen || "01");
  };

  const handleResetSingle = (s: StudentAccount) => {
    playClickSound();
    const ok = window.confirm(
      `Reset seluruh skor materi dan skor kuis untuk siswa: "${s.name}" (Absen #${s.noAbsen || "-"})?\n\nSkor materi dan evaluasi kuis akan menjadi 0.`
    );
    if (!ok) return;
    resetSinglePointsMutation.mutate(s.id);
  };

  const handleDelete = (s: StudentAccount) => {
    playClickSound();
    const ok = window.confirm(`Apakah Anda yakin ingin menghapus akun siswa "${s.name}" dari sistem?`);
    if (!ok) return;
    deleteStudentMutation.mutate(s.id);
  };

  // Filter siswa
  const filteredStudents = students.filter((s) => {
    if (filterKelas !== "all" && s.kelas !== filterKelas) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchAbsen = (s.noAbsen || "").includes(q);
      if (!matchName && !matchEmail && !matchAbsen) return false;
    }
    return true;
  });

  return (
    <section className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border-4 border-amber-200 dark:border-slate-800 shadow-xl shadow-amber-200/20 dark:shadow-none space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎒</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Pusat Kontrol Akun Siswa &amp; Presensi SD
            </h2>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Kelola identitas kelas, nomor absen, pantau poin petualangan game, dan kontrol akses akun murid.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playClickSound();
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
        >
          <span>➕</span>
          <span>Daftarkan Siswa Baru</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <span>✓</span>
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter & Pencarian Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 dark:bg-slate-800/50 p-3 rounded-2xl border border-amber-200/80 dark:border-slate-700">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1">Kelas:</span>
          {(["all", "Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                playClickSound();
                setFilterKelas(k);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                filterKelas === k
                  ? "bg-amber-400 text-amber-950 shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100"
              }`}
            >
              {k === "all" ? `Semua (${students.length})` : k}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, absen, atau email..."
            className="w-full sm:w-64 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabel Akun Siswa */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500">Memuat data siswa...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          Tidak ada data siswa yang cocok dengan filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3.5">Absen</th>
                <th className="py-3 px-3.5">Nama Siswa</th>
                <th className="py-3 px-3.5">Kelas</th>
                <th className="py-3 px-3.5">📖 Skor Materi</th>
                <th className="py-3 px-3.5">📝 Skor Kuis</th>
                <th className="py-3 px-3.5">Status Belajar</th>
                <th className="py-3 px-3.5 text-right">Aksi Kontrol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredStudents.map((s) => {
                const isTuntas = (s.weakness?.status || "tuntas") === "tuntas";
                return (
                  <tr
                    key={s.id}
                    className="hover:bg-amber-50/40 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3.5">
                      <span className="font-black px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px]">
                        #{s.noAbsen || "01"}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{s.email}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`font-black px-2.5 py-0.5 rounded-full text-[10px] ${
                          s.kelas === "Kelas 5"
                            ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {s.kelas || "Kelas 4"}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="font-black text-amber-700 dark:text-amber-400">
                        ⭐ {s.materialScore ?? s.points ?? 0} Poin
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="font-black text-emerald-700 dark:text-emerald-400">
                        📝 {s.quizScore ?? (s.weakness ? s.weakness.score * 10 : 0)} / 100
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          isTuntas
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}
                      >
                        <span>{isTuntas ? "✓" : "!"}</span>
                        <span>{isTuntas ? "Tuntas KKTP" : "Perlu Bimbingan"}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          title="Edit nama, kelas, atau nomor absen"
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-[11px] font-bold transition cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetSingle(s)}
                          title="Reset poin kuis & petualangan game siswa ini"
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-[11px] font-bold transition cursor-pointer"
                        >
                          🔄 Reset Poin
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          title="Hapus akun siswa ini"
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-[11px] font-bold transition cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL TAMBAH SISWA BARU */}
      {isAddModalOpen && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎒</span>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Daftarkan Siswa Baru ke Kelas
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newName.trim() || !newEmail.trim()) {
                    alert("Nama dan email wajib diisi.");
                    return;
                  }
                  addStudentMutation.mutate({
                    name: newName.trim(),
                    email: newEmail.trim(),
                    password: newPassword || "siswa123",
                    kelas: newKelas,
                    noAbsen: newNoAbsen.trim() || "01",
                  });
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Lengkap Siswa:
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Doni Pratama"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Kelas:
                    </label>
                    <select
                      value={newKelas}
                      onChange={(e) => setNewKelas(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
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
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Nomor Absen:
                    </label>
                    <input
                      type="text"
                      required
                      value={newNoAbsen}
                      onChange={(e) => setNewNoAbsen(e.target.value)}
                      placeholder="Contoh: 08"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Alamat Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="doni@sekolah.sch.id"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kata Sandi Awal:
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Default: siswa123"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addStudentMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {addStudentMutation.isPending ? "Menyimpan..." : "Daftarkan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL EDIT SISWA */}
      {editingStudent && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✏️</span>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Edit Data Profil Siswa
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editName.trim() || !editEmail.trim()) {
                    alert("Nama dan email wajib diisi.");
                    return;
                  }
                  updateStudentMutation.mutate({
                    id: editingStudent.id,
                    data: {
                      name: editName.trim(),
                      email: editEmail.trim(),
                      kelas: editKelas,
                      noAbsen: editNoAbsen.trim() || "01",
                    },
                  });
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Lengkap Siswa:
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Kelas Siswa:
                    </label>
                    <select
                      value={editKelas}
                      onChange={(e) => setEditKelas(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
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
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Nomor Absen:
                    </label>
                    <input
                      type="text"
                      required
                      value={editNoAbsen}
                      onChange={(e) => setEditNoAbsen(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Alamat Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updateStudentMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    {updateStudentMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
}
