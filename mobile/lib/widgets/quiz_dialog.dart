// lib/widgets/quiz_dialog.dart
// Modal Kuis Adaptif SD Interaktif (Level 1, 2, 3)

import 'package:flutter/material.dart';
import '../models/lesson_data.dart';

class QuizDialog extends StatefulWidget {
  final ChapterItem chapter;
  final Function(int level, int pointsEarned) onQuizCompleted;

  const QuizDialog({
    super.key,
    required this.chapter,
    required this.onQuizCompleted,
  });

  @override
  State<QuizDialog> createState() => _QuizDialogState();
}

class _QuizDialogState extends State<QuizDialog> {
  int _currentQuestionIndex = 0;
  int? _selectedOption;
  bool _hasSubmitted = false;
  int _earnedPoints = 0;

  List<QuizQuestion> get _questions => widget.chapter.questions;

  @override
  Widget build(BuildContext context) {
    if (_questions.isEmpty) {
      return AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text("Kuis Belum Tersedia"),
        content: const Text("Kuis untuk bab ini sedang disiapkan oleh Bapak/Ibu Guru ya!"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Kembali"),
          ),
        ],
      );
    }

    final currentQ = _questions[_currentQuestionIndex];
    final isCorrect = _selectedOption == currentQ.correctIndex;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 420),
        padding: const EdgeInsets.all(22),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Level & Poin
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: currentQ.level == 1
                          ? Colors.green.shade100
                          : currentQ.level == 2
                              ? Colors.amber.shade100
                              : Colors.purple.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      "Level ${currentQ.level} • Soal ${_currentQuestionIndex + 1}/${_questions.length}",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: currentQ.level == 1
                            ? Colors.green.shade900
                            : currentQ.level == 2
                                ? Colors.amber.shade900
                                : Colors.purple.shade900,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded, color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Pertanyaan
              Text(
                currentQ.question,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E293B),
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 18),

              // Pilihan Jawaban
              ...List.generate(currentQ.options.length, (idx) {
                final optionText = currentQ.options[idx];
                final isSelected = _selectedOption == idx;

                Color borderColor = Colors.grey.shade300;
                Color bgColor = Colors.grey.shade50;
                Color textColor = Colors.black87;

                if (_hasSubmitted) {
                  if (idx == currentQ.correctIndex) {
                    borderColor = Colors.green.shade500;
                    bgColor = Colors.green.shade50;
                    textColor = Colors.green.shade900;
                  } else if (isSelected && !isCorrect) {
                    borderColor = Colors.red.shade400;
                    bgColor = Colors.red.shade50;
                    textColor = Colors.red.shade900;
                  }
                } else if (isSelected) {
                  borderColor = const Color(0xFF0284C7);
                  bgColor = const Color(0xFFF0F9FF);
                  textColor = const Color(0xFF0369A1);
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    onTap: _hasSubmitted
                        ? null
                        : () {
                            setState(() {
                              _selectedOption = idx;
                            });
                          },
                    borderRadius: BorderRadius.circular(16),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: borderColor, width: isSelected ? 2 : 1.2),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 30,
                            height: 30,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isSelected
                                  ? const Color(0xFF0284C7)
                                  : Colors.white,
                              border: Border.all(
                                color: isSelected
                                    ? const Color(0xFF0284C7)
                                    : Colors.grey.shade400,
                              ),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              String.fromCharCode(65 + idx),
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: isSelected ? Colors.white : Colors.black87,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              optionText,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: textColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),

              // Kotak Penjelasan jika sudah jawab
              if (_hasSubmitted) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isCorrect ? Colors.green.shade50 : Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isCorrect ? Colors.green.shade300 : Colors.amber.shade300,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isCorrect ? "🎉 Jawabanmu Benar! (+10 ⭐)" : "💡 Belum Tepat! Yuk Pelajari:",
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: isCorrect ? Colors.green.shade800 : Colors.amber.shade900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        currentQ.explanation,
                        style: TextStyle(
                          fontSize: 12,
                          color: isCorrect ? Colors.green.shade900 : Colors.amber.shade900,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 18),

              // Tombol Submit / Lanjut
              ElevatedButton(
                onPressed: _selectedOption == null
                    ? null
                    : () {
                        if (!_hasSubmitted) {
                          setState(() {
                            _hasSubmitted = true;
                            if (isCorrect) {
                              _earnedPoints += 10;
                            }
                          });
                        } else {
                          // Lanjut ke soal berikutnya atau selesai
                          if (_currentQuestionIndex + 1 < _questions.length) {
                            setState(() {
                              _currentQuestionIndex++;
                              _selectedOption = null;
                              _hasSubmitted = false;
                            });
                          } else {
                            widget.onQuizCompleted(currentQ.level, _earnedPoints);
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                backgroundColor: const Color(0xFF059669),
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                content: Text(
                                  "Horeee! Kuis berhasil dituntaskan! Total Poin Bertambah +$_earnedPoints ⭐",
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ),
                            );
                          }
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 2,
                ),
                child: Text(
                  !_hasSubmitted
                      ? "Periksa Jawaban 🚀"
                      : (_currentQuestionIndex + 1 < _questions.length
                          ? "Soal Berikutnya ➡️"
                          : "Selesaikan Kuis 🏆"),
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
