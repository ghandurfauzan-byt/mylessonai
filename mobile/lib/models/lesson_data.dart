// lib/models/lesson_data.dart
// Model data untuk Ruang Belajar Siswa SD (ExplainMyLesson AI)

class ChapterItem {
  final String id;
  final String chapterCode;
  final String title;
  final String subject; // 'pkn' | 'bjawa'
  final String subjectLabel;
  final String summaryTitle;
  final List<String> summaryPoints;
  final String audioScript;
  final List<QuizQuestion> questions;

  const ChapterItem({
    required this.id,
    required this.chapterCode,
    required this.title,
    required this.subject,
    required this.subjectLabel,
    required this.summaryTitle,
    required this.summaryPoints,
    required this.audioScript,
    required this.questions,
  });
}

class QuizQuestion {
  final int level;
  final String question;
  final List<String> options;
  final int correctIndex;
  final String explanation;

  const QuizQuestion({
    required this.level,
    required this.question,
    required this.options,
    required this.correctIndex,
    required this.explanation,
  });
}

class LeaderboardStudent {
  final int rank;
  final String name;
  final String school;
  final int points;
  final String badge;

  const LeaderboardStudent({
    required this.rank,
    required this.name,
    required this.school,
    required this.points,
    required this.badge,
  });
}

class SampleData {
  static const List<LeaderboardStudent> topStudents = [
    LeaderboardStudent(
      rank: 1,
      name: "Ghandur Fauzan",
      school: "SDN 1 Madiun",
      points: 420,
      badge: "👑 Juara Utama",
    ),
    LeaderboardStudent(
      rank: 2,
      name: "Siti Rahmawati",
      school: "SDN 1 Madiun",
      points: 390,
      badge: "⭐ Bintang Teladan",
    ),
    LeaderboardStudent(
      rank: 3,
      name: "Budi Santoso",
      school: "SDN 1 Madiun",
      points: 350,
      badge: "⚡ Siswa Tangkas",
    ),
  ];

  static const List<ChapterItem> chapters = [
    ChapterItem(
      id: "pkn-sila3",
      chapterCode: "Bab 1",
      title: "Makna Lambang Sila Ke-3: Persatuan Indonesia di Sekolah & Rumah",
      subject: "pkn",
      subjectLabel: "Pendidikan Pancasila & PKn",
      summaryTitle: "Pohon Beringin Lambang Persatuan Bangsa 🌳",
      summaryPoints: [
        "Arti Lambang: Sila ke-3 dilambangkan dengan Pohon Beringin yang rimbun dan berakar kokoh, melambangkan bangsa Indonesia yang bersatu di bawah naungan NKRI.",
        "Pengamalan di Sekolah: Belajar bersama dan bermain tanpa membeda-bedakan suku, agama, maupun asal daerah teman sekelas.",
        "Pengamalan di Rumah: Saling membantu anggota keluarga, menjaga kerukunan antar saudara, dan mematuhi nasihat orang tua.",
        "Sikap Karakter: Membiasakan sikap rukun, tidak suka bertengkar, dan mendahulukan kepentingan bersama demi keharmonisan.",
      ],
      audioScript:
          "Halo adik-adik hebat! Bab satu mengajarkan makna Pohon Beringin pada Sila ke-3. Kita harus rukun dengan teman tanpa membeda-bedakan ya!",
      questions: [
        QuizQuestion(
          level: 1,
          question: "Apa lambang dari sila ke-3 Pancasila?",
          options: ["Bintang Emas", "Rantai Baja", "Pohon Beringin", "Kepala Banteng"],
          correctIndex: 2,
          explanation: "Sila ke-3 dilambangkan dengan Pohon Beringin yang melambangkan persatuan bangsa.",
        ),
        QuizQuestion(
          level: 2,
          question: "Contoh pengamalan sila ke-3 di lingkungan sekolah adalah...",
          options: [
            "Memilih teman hanya yang satu daerah",
            "Bekerja sama membersihkan kelas piket",
            "Mengejek teman yang berbeda logat bicara",
            "Mementingkan diri sendiri saat bermain",
          ],
          correctIndex: 1,
          explanation: "Bekerja sama membersihkan kelas merupakan bentuk persatuan dan gotong royong di sekolah.",
        ),
        QuizQuestion(
          level: 3,
          question: "Mengapa persatuan sangat penting bagi bangsa Indonesia yang beraneka ragam?",
          options: [
            "Agar negara kita tidak mudah dipecah belah dan hidup rukun damai",
            "Agar semua orang menjadi sama tanpa perbedaan",
            "Agar kita tidak perlu belajar kebudayaan lain",
            "Agar hanya ada satu suku yang paling berkuasa",
          ],
          correctIndex: 0,
          explanation: "Persatuan menjaga keutuhan bangsa agar kita hidup damai, tenteram, dan tidak mudah diadu domba.",
        ),
      ],
    ),
    ChapterItem(
      id: "pkn-gotongroyong",
      chapterCode: "Bab 2",
      title: "Gotong Royong & Nilai Kekeluargaan Sekolah",
      subject: "pkn",
      subjectLabel: "Pendidikan Pancasila & PKn",
      summaryTitle: "Berat Sama Dipikul, Ringan Sama Dijinjing 💪",
      summaryPoints: [
        "Makna Gotong Royong: Bekerja bersama-sama demi mencapai tujuan bersama dengan sukarela dan ikhlas.",
        "Aksi Nyata Sekolah: Bersama merapikan perpustakaan, merawat taman sekolah, dan membantu kawan yang terkena musibah.",
        "Manfaat Nyata: Pekerjaan yang berat menjadi ringan, tugas cepat selesai, dan menumbuhkan rasa persaudaraan yang erat.",
      ],
      audioScript:
          "Gotong royong adalah budaya asli bangsa kita. Dengan tolong menolong, pekerjaan berat pun terasa ringan dan seru!",
      questions: [
        QuizQuestion(
          level: 1,
          question: "Peribahasa yang melambangkan gotong royong adalah...",
          options: [
            "Air tenang menghanyutkan",
            "Berat sama dipikul, ringan sama dijinjing",
            "Besar pasak daripada tiang",
            "Ada gula ada semut",
          ],
          correctIndex: 1,
          explanation: "Berat sama dipikul, ringan sama dijinjing artinya saling tolong-menolong dalam suka dan duka.",
        ),
      ],
    ),
    ChapterItem(
      id: "bjawa-geguritan",
      chapterCode: "Bab 3",
      title: "Geguritan & Trap-Trapan Budi Pekerti Luhur",
      subject: "bjawa",
      subjectLabel: "Muatan Lokal Bahasa Jawa",
      summaryTitle: "Nulis Lan Maca Geguritan Kanthi Becik 📜",
      summaryPoints: [
        "Tegese Geguritan: Geguritan yaiku puisi Jawa gagrag anyar kang ora kaiket paugeran tartamtu nanging tetep endah basane.",
        "Trap-Trapan Maca: Kudu nggatekake wirama (lagu), wirasa (rasa), wiraga (patrap solah bawa), lan wicara (pocapan cetha).",
        "Piwulang Budi Pekerti: Isine geguritan asring ngemot pitutur luhur marang wong tuwa, guru, lan tresna marang bangsa.",
      ],
      audioScript:
          "Geguritan yaiku gegubahan sastra Jawa kang endah. Nalika maca, kudu cetha pocapane lan trep karo rasane ya bocah-bocah!",
      questions: [
        QuizQuestion(
          level: 1,
          question: "Puisi Jawa gagrag anyar kang endah basane diarani...",
          options: ["Cangkriman", "Geguritan", "Parikan", "Wangsalan"],
          correctIndex: 1,
          explanation: "Geguritan yaiku puisi tradisional Jawa gagrag anyar.",
        ),
      ],
    ),
  ];
}
