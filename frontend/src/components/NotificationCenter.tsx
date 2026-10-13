// src/components/NotificationCenter.tsx — Pusat Notifikasi & Rekomendasi Adaptif (FR-20)
//
// Menampilkan notifikasi peringatan dini, ajakan misi belajar seru, penambahan koin prestasi,
// dan hasil validasi kurikulum bagi Guru & Siswa dengan dukungan penuh Mode Terang & Gelap.

import { fetchNotifications, markNotificationRead } from "@/lib/api/classApi";
import { playClickSound } from "@/lib/soundEffects";
import type { NotificationItem } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function NotificationCenter({
  role = "pelajar",
}: { role?: "pelajar" | "pengajar" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "role" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const location = useLocation();
  const isTeacher = role === "pengajar" || location.pathname.startsWith("/dashboard/pengajar");

  const { data: rawNotifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ["notifications", role],
    queryFn: () => fetchNotifications(role),
    staleTime: 1000 * 15,
  });

  // Filter notifikasi murni seputar pengerjaan murid (kuis, poin prestasi, misi belajar, ranking, lencana)
  // Menghapus semua notifikasi teknis "API", validasi kurikulum modul, dsb. yang merupakan ranah guru
  const notifications = rawNotifications.filter((item) => {
    const text = `${item.title} ${item.message}`.toLowerCase();
    const isApiTechnical =
      item.targetRole === "pengajar" ||
      text.includes("api") ||
      text.includes("tervalidasi") ||
      text.includes("kurikulum kemdikbud") ||
      text.includes("disdikbud") ||
      text.includes("modul bab 3 tervalidasi") ||
      text.includes("modul bab 1 aktif");
    return !isApiTechnical;
  });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filter tab list
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "unread") return !item.isRead;
    if (activeTab === "role") {
      const text = `${item.title} ${item.message}`.toLowerCase();
      return (
        text.includes("kuis") ||
        text.includes("poin") ||
        text.includes("misi") ||
        text.includes("level") ||
        text.includes("lencana") ||
        text.includes("ranking") ||
        text.includes("peringkat") ||
        text.includes("skor") ||
        text.includes("tantangan")
      );
    }
    return true;
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleOpen() {
    playClickSound();
    setIsOpen(!isOpen);
  }

  function handleMarkAllRead() {
    playClickSound();
    notifications
      .filter((n) => !n.isRead)
      .forEach((n) => {
        readMutation.mutate(n.id);
      });
  }

  // Notifikasi & badge angka hanya tampil di Ruang Siswa, disembunyikan total di Meja Guru
  if (isTeacher || !location.pathname.startsWith("/dashboard/pelajar")) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Pusat Notifikasi Rekomendasi"
        aria-expanded={isOpen}
        title="Notifikasi & Misi Belajar"
        className="relative w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <title>Ikon Notifikasi</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="region"
          aria-label="Daftar Notifikasi"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Panel */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                {isTeacher ? "Pemberitahuan Guru 👨‍🏫" : "Misi & Notifikasi Siswa 👧"}
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                AI Adaptif ⚡
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Baca Semua
              </button>
            )}
          </div>

          {/* Filter Tab Chips */}
          <div className="flex items-center gap-1.5 mb-3 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab("all");
              }}
              className={`flex-1 py-1 rounded-lg transition text-center ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab("role");
              }}
              className={`flex-1 py-1 rounded-lg transition text-center ${
                activeTab === "role"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              {isTeacher ? "Fitur Guru 👨‍🏫" : "Misi Kuis & Poin 🎮"}
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab("unread");
              }}
              className={`flex-1 py-1 rounded-lg transition text-center ${
                activeTab === "unread"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* Notification List Container */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <span className="text-sm font-bold text-slate-400 block">•</span>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Tidak ada notifikasi pada kategori ini.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const isUnread = !n.isRead;
                return (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border text-xs transition relative ${
                      isUnread
                        ? n.type === "warning"
                          ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-slate-800 dark:text-amber-100 shadow-sm"
                          : n.type === "success"
                            ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-slate-800 dark:text-emerald-100 shadow-sm"
                            : "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-slate-800 dark:text-blue-100 shadow-sm"
                        : "bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-extrabold flex items-center gap-1.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          n.type === "warning" ? "bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200" : n.type === "success" ? "bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200" : "bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-200"
                        }`}>
                          {n.type === "warning" ? "⚠️ PERHATIAN" : n.type === "success" ? "🎉 SUKSES" : "💡 INFO"}
                        </span>
                        <span className="text-slate-900 dark:text-white">{n.title}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 font-medium">
                        {n.createdAt}
                      </span>
                    </div>

                    <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {n.message}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                      <Link
                        to={n.link}
                        onClick={() => {
                          playClickSound();
                          readMutation.mutate(n.id);
                          setIsOpen(false);
                        }}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1"
                      >
                        <span>{isTeacher ? "Tinjau Panel 👨‍🏫" : "Buka Petualangan 🚀"}</span>
                        <span>&rarr;</span>
                      </Link>

                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            readMutation.mutate(n.id);
                          }}
                          className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg shadow-2xs"
                        >
                          Tandai Selesai ✅
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
