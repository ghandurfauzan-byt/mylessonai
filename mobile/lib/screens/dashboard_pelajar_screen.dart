// lib/screens/dashboard_pelajar_screen.dart
// Tampilan Ruang Belajar & Dashboard Pelajar SD — ExplainMyLesson AI

import 'package:flutter/material.dart';
import '../models/lesson_data.dart';
import '../widgets/quiz_dialog.dart';

class DashboardPelajarScreen extends StatefulWidget {
  const DashboardPelajarScreen({super.key});

  @override
  State<DashboardPelajarScreen> createState() => _DashboardPelajarScreenState();
}

class _DashboardPelajarScreenState extends State<DashboardPelajarScreen> {
  int _totalPoints = 420;
  String _selectedSubjectFilter = "all"; // 'all' | 'pkn' | 'bjawa'
  int _selectedChapterIndex = 0;
  bool _isPlayingAudio = false;

  // 5 Misi Harian
  bool _missionReadSummary = false;
  bool _missionListenedAudio = false;
  bool _missionQuiz1 = false;
  bool _missionQuiz2 = false;
  bool _missionQuiz3 = false;

  int get _completedMissionsCount => [
        _missionReadSummary,
        _missionListenedAudio,
        _missionQuiz1,
        _missionQuiz2,
        _missionQuiz3,
      ].where((m) => m).length;

  List<ChapterItem> get _filteredChapters {
    if (_selectedSubjectFilter == "all") return SampleData.chapters;
    return SampleData.chapters
        .where((c) => c.subject == _selectedSubjectFilter)
        .toList();
  }

  ChapterItem get _currentChapter {
    final list = _filteredChapters;
    if (_selectedChapterIndex >= list.length) return list.first;
    return list[_selectedChapterIndex];
  }

  void _triggerAudioExplanation() {
    setState(() {
      _isPlayingAudio = !_isPlayingAudio;
      if (_isPlayingAudio && !_missionListenedAudio) {
        _missionListenedAudio = true;
        _totalPoints += 10;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF0284C7),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            content: const Text(
              "🎧 Keren! Kamu mendengarkan penjelasan materi (+10 ⭐ Poin)!",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        );
      }
    });
  }

  void _triggerUnderstandMaterial() {
    if (_missionReadSummary) return;
    setState(() {
      _missionReadSummary = true;
      _totalPoints += 10;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF059669),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: const Text(
          "🌟 Hebat! Kamu telah membaca & memahami materi (+10 ⭐ Poin)!",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  void _openQuiz() {
    showDialog(
      context: context,
      builder: (ctx) => QuizDialog(
        chapter: _currentChapter,
        onQuizCompleted: (level, points) {
          setState(() {
            _totalPoints += points;
            if (level == 1) _missionQuiz1 = true;
            if (level == 2) _missionQuiz2 = true;
            if (level == 3) _missionQuiz3 = true;
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Abu-abu lembut
      appBar: _buildAppBar(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildProfileBanner(),
            const SizedBox(height: 14),
            _buildSubjectTabs(),
            const SizedBox(height: 14),
            _buildChapterSelector(),
            const SizedBox(height: 16),
            _buildWhiteboardCard(),
            const SizedBox(height: 16),
            _buildDailyMissionsCard(),
            const SizedBox(height: 16),
            _buildLeaderboardPodium(),
            const SizedBox(height: 80), // Padding bawah agar tidak ketutup FAB
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openQuiz,
        backgroundColor: const Color(0xFFF59E0B),
        foregroundColor: const Color(0xFF451A03),
        elevation: 4,
        icon: const Icon(Icons.videogame_asset_rounded, size: 26),
        label: const Text(
          "Tantangan Kuis Bab! 🚀",
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 1,
      shadowColor: Colors.black12,
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFBBF24), Color(0xFFF472B6), Color(0xFF38BDF8)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              "SD",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white),
            ),
          ),
          const SizedBox(width: 10),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "ExplainMyLesson AI",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
              Text(
                "Ruang Belajar Siswa SD Negeri 1 Madiun",
                style: TextStyle(fontSize: 10, color: Color(0xFF64748B), fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFFDE68A), width: 1.5),
            ),
            child: Row(
              children: [
                const Icon(Icons.star_rounded, color: Color(0xFFD97706), size: 18),
                const SizedBox(width: 4),
                Text(
                  "$_totalPoints ⭐",
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF92400E),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0284C7).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFBAE6FD), width: 3),
            ),
            alignment: Alignment.center,
            child: const Text("👦", style: TextStyle(fontSize: 28)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Halo, Ghandur Fauzan! 👋",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  "Kelas 4A • SDN 1 Madiun",
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    "🎯 Kurikulum Merdeka & Mulok Bahasa Jawa",
                    style: TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectTabs() {
    final filters = [
      {"id": "all", "label": "Semua Bab 🌟"},
      {"id": "pkn", "label": "Pancasila (PKn) 🇮🇩"},
      {"id": "bjawa", "label": "Bahasa Jawa 🎭"},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters.map((f) {
          final isSelected = _selectedSubjectFilter == f["id"];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () {
                setState(() {
                  _selectedSubjectFilter = f["id"]!;
                  _selectedChapterIndex = 0;
                });
              },
              borderRadius: BorderRadius.circular(16),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF0284C7) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF0284C7) : Colors.grey.shade300,
                  ),
                ),
                child: Text(
                  f["label"]!,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: isSelected ? Colors.white : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildChapterSelector() {
    final chapters = _filteredChapters;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Pilih Bab Pembelajaran:",
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: Color(0xFF334155),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 94,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: chapters.length,
            itemBuilder: (ctx, idx) {
              final item = chapters[idx];
              final isSelected = _selectedChapterIndex == idx;

              return Padding(
                padding: const EdgeInsets.only(right: 10),
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _selectedChapterIndex = idx;
                      _isPlayingAudio = false;
                    });
                  },
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    width: 220,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade200,
                        width: isSelected ? 2 : 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: item.subject == "pkn"
                                    ? Colors.red.shade100
                                    : Colors.teal.shade100,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                item.chapterCode,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: item.subject == "pkn"
                                      ? Colors.red.shade900
                                      : Colors.teal.shade900,
                                ),
                              ),
                            ),
                            const Spacer(),
                            if (isSelected)
                              const Icon(Icons.check_circle_rounded, color: Color(0xFF2563EB), size: 16),
                          ],
                        ),
                        const SizedBox(height: 5),
                        Text(
                          item.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: isSelected ? const Color(0xFF1E3A8A) : const Color(0xFF1E293B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildWhiteboardCard() {
    final chapter = _currentChapter;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Papan Tulis
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE0F2FE),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        "${chapter.chapterCode} • ${chapter.subjectLabel}",
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0369A1),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      chapter.summaryTitle,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
              // Tombol Suara Audio
              ElevatedButton.icon(
                onPressed: _triggerAudioExplanation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isPlayingAudio ? Colors.red.shade500 : const Color(0xFF0284C7),
                  foregroundColor: Colors.white,
                  elevation: 1,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
                icon: Icon(_isPlayingAudio ? Icons.stop_rounded : Icons.volume_up_rounded, size: 18),
                label: Text(
                  _isPlayingAudio ? "Berhenti" : "Dengarkan",
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Audio animation box jika suara aktif
          if (_isPlayingAudio)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                children: [
                  const Text("🤖", style: TextStyle(fontSize: 20)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      chapter.audioScript,
                      style: TextStyle(fontSize: 11, color: Colors.green.shade900, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),

          // Poin-poin Dongeng Materi (Bento style)
          ...chapter.summaryPoints.map((point) {
            final colonIndex = point.indexOf(":");
            final hasLabel = colonIndex > 0;
            final label = hasLabel ? point.substring(0, colonIndex).trim() : null;
            final body = hasLabel ? point.substring(colonIndex + 1).trim() : point;

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (label != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        "📌 $label",
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0284C7),
                        ),
                      ),
                    ),
                  Text(
                    body,
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF334155),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 6),

          // Kartu Klaim Poin Otomatis
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFCD34D)),
            ),
            child: Row(
              children: [
                const Text("🌟", style: TextStyle(fontSize: 22)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _missionReadSummary
                            ? "Materi Berhasil Dipahami! 🎉"
                            : "Membaca & Memahami Materi",
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF78350F),
                        ),
                      ),
                      Text(
                        _missionReadSummary
                            ? "Poin prestasimu sudah otomatis bertambah +10 ⭐!"
                            : "Klik tombol di samping untuk klaim pemahaman bab ini.",
                        style: const TextStyle(fontSize: 10, color: Color(0xFF92400E)),
                      ),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: _triggerUnderstandMaterial,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _missionReadSummary ? const Color(0xFF10B981) : const Color(0xFFD97706),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  ),
                  child: Text(
                    _missionReadSummary ? "Tuntas ✅" : "Klaim +10 ⭐",
                    style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDailyMissionsCard() {
    final missions = [
      {
        "title": "Memahami Materi yang Disampaikan 📖",
        "reward": "+10 ⭐",
        "done": _missionReadSummary,
      },
      {
        "title": "Mendengarkan Penjelasan Materi 🎧",
        "reward": "+10 ⭐",
        "done": _missionListenedAudio,
      },
      {
        "title": "Taklukkan Kuis Level 1 (Mudah) 🎮",
        "reward": "+10 🏆",
        "done": _missionQuiz1,
      },
      {
        "title": "Taklukkan Kuis Level 2 (Sedang) ⚡",
        "reward": "+20 🏆",
        "done": _missionQuiz2,
      },
      {
        "title": "Taklukkan Kuis Level 3 (Juara) 👑",
        "reward": "+30 🏆",
        "done": _missionQuiz3,
      },
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.flag_rounded, color: Color(0xFFD97706), size: 20),
                  SizedBox(width: 6),
                  Text(
                    "Misi Harian Belajar:",
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _completedMissionsCount == 5
                      ? Colors.green.shade100
                      : Colors.amber.shade100,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  _completedMissionsCount == 5 ? "🎉 5/5 Tuntas!" : "🎯 $_completedMissionsCount/5 Tuntas",
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: _completedMissionsCount == 5
                        ? Colors.green.shade900
                        : Colors.amber.shade900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Linear Progress
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: _completedMissionsCount / 5,
              backgroundColor: Colors.grey.shade200,
              valueColor: const AlwaysStoppedAnimation(Color(0xFF10B981)),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 12),

          // Daftar Misi
          ...missions.map((m) {
            final isDone = m["done"] as bool;
            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: isDone ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDone ? Colors.green.shade300 : Colors.grey.shade200,
                ),
              ),
              child: Row(
                children: [
                  Text(isDone ? "✅" : "⏳", style: const TextStyle(fontSize: 14)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      m["title"] as String,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isDone ? Colors.green.shade900 : const Color(0xFF334155),
                      ),
                    ),
                  ),
                  Text(
                    isDone ? "Tuntas" : m["reward"] as String,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: isDone ? Colors.green.shade700 : const Color(0xFFD97706),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildLeaderboardPodium() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.emoji_events_rounded, color: Color(0xFFF59E0B), size: 20),
              SizedBox(width: 6),
              Text(
                "Tangga Juara Kelas 4A 🏆",
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            "Tiga Siswa Peraih Bintang Prestasi Tertinggi Pekan Ini",
            style: TextStyle(fontSize: 10, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 14),

          // 3 Podium Card
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Juara 2
              _buildPodiumItem(
                name: "Siti Rahma",
                points: "390 ⭐",
                rank: "2",
                podiumColor: Colors.grey.shade300,
                height: 80,
                avatar: "👧",
              ),
              // Juara 1 (Paling Tinggi)
              _buildPodiumItem(
                name: "Ghandur",
                points: "$_totalPoints ⭐",
                rank: "1 👑",
                podiumColor: const Color(0xFFFDE68A),
                height: 105,
                avatar: "👦",
              ),
              // Juara 3
              _buildPodiumItem(
                name: "Budi S.",
                points: "350 ⭐",
                rank: "3",
                podiumColor: Colors.amber.shade200,
                height: 65,
                avatar: "🧒",
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPodiumItem({
    required String name,
    required String points,
    required String rank,
    required Color podiumColor,
    required double height,
    required String avatar,
  }) {
    return Column(
      children: [
        Text(avatar, style: const TextStyle(fontSize: 24)),
        const SizedBox(height: 4),
        Text(
          name,
          style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800),
        ),
        Text(
          points,
          style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFFD97706)),
        ),
        const SizedBox(height: 6),
        Container(
          width: 75,
          height: height,
          decoration: BoxDecoration(
            color: podiumColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
          ),
          alignment: Alignment.center,
          child: Text(
            rank,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.black87),
          ),
        ),
      ],
    );
  }
}
