// lib/main.dart
// Entry point Aplikasi Mobile ExplainMyLesson AI (Khusus Ruang Siswa / Pelajar SD)

import 'package:flutter/material.dart';
import 'screens/dashboard_pelajar_screen.dart';

void main() {
  runApp(const ExplainMyLessonApp());
}

class ExplainMyLessonApp extends StatelessWidget {
  const ExplainMyLessonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ExplainMyLesson AI - Ruang Siswa SD',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0284C7),
          primary: const Color(0xFF0284C7),
          secondary: const Color(0xFFF59E0B),
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF1F5F9),
        fontFamily: 'Segoe UI', // Bersih dan mudah dibaca
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF0F172A),
          elevation: 1,
        ),
      ),
      home: const DashboardPelajarScreen(),
    );
  }
}
