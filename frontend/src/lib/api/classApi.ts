// src/lib/api/classApi.ts
//
// BARU pada Tugas 8. Pada Tugas 7, ClassSummaryCards / ChapterProgressList /
// StudentsNeedingHelp / AiContentPanel adalah ASYNC SERVER COMPONENT yang
// memanggil lib/data.ts langsung (tanpa HTTP round-trip). Vite adalah SPA
// murni tanpa RSC, sehingga keempat entitas ini kini diseragamkan mengikuti
// pola yang SUDAH dipakai Materials & Quiz Questions sejak Tugas 7: fetch API
// REST + validasi Zod di sini, dikonsumsi lewat TanStack Query di hooks/.

import type { AiMode } from "@shared/catalog";
import {
  type AiContent,
  AiContentSchema,
  type ChapterProgress,
  ChapterProgressResponseSchema,
  type ClassRoom,
  ClassRoomListResponseSchema,
  type ClassSummary,
  ClassSummarySchema,
  type CreateClassRoomInput,
  type NotificationItem,
  NotificationListResponseSchema,
  type StudentHelp,
  StudentsNeedingHelpResponseSchema,
} from "@shared/schema";

export async function fetchClassSummary(): Promise<ClassSummary> {
  const response = await fetch("/api/class-summary");
  const rawData = await response.json().catch(() => null);
  if (!response.ok) throw new Error("Gagal memuat ringkasan kelas.");
  return ClassSummarySchema.parse(rawData);
}

export async function fetchChapterProgress(): Promise<ChapterProgress[]> {
  const response = await fetch("/api/chapter-progress");
  const rawData = await response.json().catch(() => null);
  if (!response.ok) throw new Error("Gagal memuat progres bab.");
  return ChapterProgressResponseSchema.parse(rawData);
}

export async function fetchStudentsNeedingHelp(): Promise<StudentHelp[]> {
  const response = await fetch("/api/students-needing-help");
  const rawData = await response.json().catch(() => null);
  if (!response.ok) throw new Error("Gagal memuat daftar pelajar perlu bimbingan.");
  return StudentsNeedingHelpResponseSchema.parse(rawData);
}

export async function fetchAiContent(chapterId: string, mode: AiMode): Promise<AiContent> {
  const params = new URLSearchParams({ chapter: chapterId, mode });
  const response = await fetch(`/api/ai-content?${params.toString()}`);
  const rawData = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(rawData?.error ?? "Gagal memuat konten AI.");
  }
  return AiContentSchema.parse(rawData);
}

export async function exportClassReportUrl(format: "csv" | "pdf" = "csv"): Promise<Response> {
  return fetch(`/api/export?format=${format}`);
}

export async function fetchClasses(): Promise<ClassRoom[]> {
  const response = await fetch("/api/classes");
  const rawData = await response.json().catch(() => null);
  if (!response.ok) throw new Error("Gagal memuat daftar kelas.");
  return ClassRoomListResponseSchema.parse(rawData);
}

export async function createClass(data: CreateClassRoomInput): Promise<ClassRoom> {
  const response = await fetch("/api/classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const rawData = await response.json().catch(() => null);
  if (!response.ok) throw new Error(rawData?.error ?? "Gagal membuat kelas.");
  return rawData;
}

export async function deleteClass(id: string): Promise<{ ok: boolean }> {
  const response = await fetch(`/api/classes/${id}`, { method: "DELETE" });
  const rawData = await response.json().catch(() => null);
  if (!response.ok) throw new Error(rawData?.error ?? "Gagal menghapus kelas.");
  return rawData;
}

export async function fetchNotifications(role?: string): Promise<NotificationItem[]> {
  const url = role ? `/api/notifications?role=${encodeURIComponent(role)}` : "/api/notifications";
  const response = await fetch(url);
  const rawData = await response.json().catch(() => null);
  if (!response.ok) throw new Error("Gagal memuat notifikasi.");
  return NotificationListResponseSchema.parse(rawData);
}

export async function createNotification(payload: {
  title: string;
  message: string;
  type?: "warning" | "info" | "success";
  link?: string;
  targetRole?: "pelajar" | "pengajar" | "all";
  icon?: string;
}): Promise<NotificationItem> {
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const rawData = await response.json().catch(() => null);
  if (!response.ok) throw new Error(rawData?.error ?? "Gagal membuat notifikasi.");
  return rawData;
}

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  const response = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
  return response.json();
}
