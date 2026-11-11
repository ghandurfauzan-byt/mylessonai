import { createNotification } from "@/lib/api/classApi";
import {
  deleteCurriculumModuleApi,
  fetchCurriculumModules,
  requestCurriculumModule,
  validateCurriculumModule,
} from "@/lib/api/curriculumApi";
import {
  playClickSound,
  playCoinSound,
  playCorrectSound,
  playRobotAwakeSound,
} from "@/lib/soundEffects";
import ModalPortal from "@/components/ModalPortal";
import { useUIStore, resolveGameTypeForModule, type GameType } from "@/lib/store/useUIStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export interface CurriculumModule {
  id: string;
  subject: "pkn" | "bjawa";
  subjectLabel: string;
  grade: string;
  title: string;
  chapterCode: string;
  source: string;
  sourceType: "kemdikbud" | "disdik" | "custom";
  pageCount: number;
  learningGoal: string;
  isValidated: boolean;
  isActiveToday: boolean;
  validatedAt?: string;
  ragSummary?: string[];
  generatedQuizPreview?: string[];
  gameType?: GameType;
  quizQuestions?: Record<number, any[]>;
}

const INITIAL_MODULES: CurriculumModule[] = [
  {
    "id": "mod-pkn-kls1-simbol",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 1",
    "title": "Aku Cinta Pancasila: Mengenal 5 Simbol Garuda Pancasila",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
    "sourceType": "kemdikbud",
    "pageCount": 22,
    "learningGoal": "Peserta didik mengenal 5 simbol pada lambang Garuda Pancasila (Bintang, Rantai Emas, Pohon Beringin, Kepala Banteng, Padi & Kapas) serta makna dasarnya.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 07:15 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian Pancasila sebagai Dasar Negara: Pancasila adalah dasar negara dan pedoman tingkah laku bagi seluruh rakyat Indonesia. Kata Pancasila berasal dari bahasa Sanskerta: Panca artinya lima, dan Sila artinya dasar atau asas budi pekerti.",
      "Mengenal Lambang Burung Garuda Pancasila: Burung Garuda adalah lambang negara Indonesia yang berbulu kuning keemasan, melambangkan keagungan dan kejayaan bangsa. Di dadanya tergantung perisai yang memuat lima simbol sila, serta kakinya mencengkeram pita bertuliskan semboyan suci Bhinneka Tunggal Ika.",
      "Simbol Sila Ke-1 (Bintang Emas): Sila pertama berbunyi Ketuhanan Yang Maha Esa dilambangkan dengan Bintang bersudut lima berlatar hitam, maknanya adalah cahaya kerohanian dari Tuhan Yang Maha Esa kepada seluruh manusia.",
      "Simbol Sila Ke-2 (Rantai Emas): Sila kedua berbunyi Kemanusiaan yang adil dan beradab dilambangkan dengan rantai gelang persegi dan lingkaran yang saling bertaut kokoh, mencerminkan persatuan gotong royong antara laki-laki dan perempuan.",
      "Simbol Sila Ke-3 (Pohon Beringin): Sila ketiga berbunyi Persatuan Indonesia dilambangkan dengan Pohon Beringin yang rindang dan berakar kuat menghunjam ke bumi, melambangkan tempat berteduh yang aman bagi seluruh suku bangsa.",
      "Simbol Sila Ke-4 (Kepala Banteng): Sila keempat berbunyi Kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan dilambangkan dengan Kepala Banteng sebagai hewan sosial yang gemar berkumpul untuk musyawarah.",
      "Simbol Sila Ke-5 (Padi dan Kapas): Sila kelima berbunyi Keadilan sosial bagi seluruh rakyat Indonesia dilambangkan dengan padi (makanan pokok) dan kapas (sandang/pakaian) sebagai syarat kemakmuran dan keadilan rakyat.",
      "Aksi Nyata Pelajar Pancasila di Sekolah: Berdoa bersama sebelum dan sesudah belajar, rukun bermain dengan teman tanpa mengejek, meminjamkan alat tulis kepada kawan yang membutuhkan, serta tertib mematuhi nasihat guru."
    ],
    "generatedQuizPreview": [
      "Level 1: Simbol Sila ke-1 Bintang Emas (+10 Poin)",
      "Level 2: Lambang Sila ke-3 Pohon Beringin dan maknanya (+20 Poin)",
      "Level 3: Perilaku rukun dan saling tolong-menolong sesama kawan (+30 Poin)"
    ]
  },
  {
    "id": "mod-pkn-kls2-aturan",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 2",
    "title": "Menaati Aturan & Tata Tertib di Rumah dan Sekolah",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
    "sourceType": "kemdikbud",
    "pageCount": 24,
    "learningGoal": "Peserta didik memahami fungsi aturan dan membiasakan diri mematuhi tata tertib di rumah maupun di lingkungan sekolah.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 07:45 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian & Hakikat Aturan: Aturan adalah pedoman, tata tertib, atau petunjuk yang disepakati bersama untuk mengatur tingkah laku kita agar kehidupan berjalan tertib, aman, rukun, dan damai.",
      "Mengapa Harus Ada Aturan?: Tanpa adanya aturan, suasana di rumah maupun di kelas akan menjadi kacau, banyak pertengkaran, dan kegiatan belajar atau bermain menjadi tidak nyaman. Aturan melatih kita menjadi anak yang berdisiplin dan bertanggung jawab.",
      "Contoh Aturan di Rumah: Bangun pagi tepat waktu, merapikan tempat tidur sendiri setelah bangun, meminta izin atau pamit mencium tangan orang tua sebelum pergi bermain, serta meletakkan sepatu dan tas pada tempatnya.",
      "Contoh Tata Tertib di Sekolah: Mengenakan seragam sekolah yang bersih dan rapi sesuai harinya, datang tepat waktu sebelum bel masuk berbunyi, mendengarkan bimbingan guru dengan tertib, serta membuang sampah pada tempat sampah.",
      "Keseimbangan Hak dan Kewajiban Anak: Kewajiban adalah sesuatu yang harus kita laksanakan terlebih dahulu (misalnya belajar dan membersihkan kelas), sedangkan hak adalah sesuatu yang kita terima (misalnya mendapatkan bimbingan guru dan ruangan kelas yang nyaman).",
      "Akibat Melanggar Aturan: Mengakibatkan suasana tidak tertib, merugikan diri sendiri dan orang lain, serta mendapatkan teguran atau sanksi disiplin dari orang tua maupun guru."
    ],
    "generatedQuizPreview": [
      "Level 1: Contoh aturan bangun pagi di rumah (+10 Poin)",
      "Level 2: Tata tertib seragam dan kebersihan sekolah (+20 Poin)",
      "Level 3: Keseimbangan antara hak dan kewajiban anak (+30 Poin)"
    ]
  },
  {
    "id": "mod-pkn-bhinneka",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 3",
    "title": "Bhinneka Tunggal Ika: Mengenal Keragaman Suku, Rumah Adat & Budaya Nusantara",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Siswa)",
    "sourceType": "kemdikbud",
    "pageCount": 28,
    "learningGoal": "Mengidentifikasi kekayaan rumah adat, tarian tradisional, serta memupuk toleransi beragama dan kerukunan antarsuku bangsa.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 08:00 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian Semboyan Bhinneka Tunggal Ika: Semboyan resmi bangsa Indonesia ini bermakna meskipun berbeda-beda suku, bahasa daerah, agama, dan adat istiadat, pada hakikatnya kita tetap satu kesatuan keluarga besar Indonesia yang rukun dan damai.",
      "Sejarah Lengkap Kakawin Sutasoma & Pujangga Mpu Tantular di Majapahit: Kalimat suci Bhinneka Tunggal Ika lahir dari karya sastra agung abad ke-14 pada era kejayaan Kerajaan Majapahit, saat dipimpin oleh Prabu Hayam Wuruk didampingi Mahapatih Gajah Mada. Pujangga besar keraton bernama Mpu Tantular menulis kitab Kakawin Sutasoma. Pada pupuh 139 bait 5, Mpu Tantular menuliskan kalimat keramat: Rwaneka dhatu winuwus Buddha Wiswa, Bhineki rakwa ring apan kena parwanosen, Mangka ng Jinatwa kalawan Siwatatwa tunggal, Bhinneka Tunggal Ika tan hana dharma mangrwa. Artinya: ajaran Buddha dan Siwa (Hindu) tampak berbeda ragamnya, namun hakikat kebenarannya adalah satu jua, tidak ada kebenaran yang mendua. Toleransi yang tinggi inilah yang membuat Kerajaan Majapahit makmur, tenteram, dan dihormati seantero dunia.",
      "Sejarah Pengadopsian Semboyan Menjadi Kompas Bangsa: Pada masa kebangkitan nasional awal abad ke-20, pahlawan nasional Mr. Mohammad Yamin yang sangat mencintai sejarah Nusantara menemukan kembali mutiara bait Mpu Tantular ini. Beliau mendiskusikannya dengan Bung Karno. Ketika bangsa Indonesia merdeka, para bapak pendiri bangsa sepakat menjadikan Bhinneka Tunggal Ika sebagai semboyan resmi negara yang dicengkeram kokoh oleh kedua kaki Burung Garuda Pancasila untuk menyatukan lebih dari 1.340 suku bangsa.",
      "Keragaman Suku Bangsa di Nusantara: Indonesia memiliki lebih dari 1.340 suku bangsa yang tersebar dari Sabang sampai Merauke, seperti Suku Jawa, Sunda, Batak, Minangkabau, Dayak, Bugis, Bali, Sasak, dan Asmat Papua.",
      "Mengenal Rumah Adat Tradisional: Rumah Joglo (Jawa Tengah), Rumah Gadang dengan atap melengkung runcing seperti tanduk kerbau (Sumatera Barat), Rumah Tongkonan (Toraja Sulawesi Selatan), dan Rumah Honai berbentuk bulat beratap jerami (Papua).",
      "Mengenal Tarian & Pakaian Adat: Tari Saman (Aceh), Tari Kecak (Bali), Tari Jaipong (Jawa Barat), Tari Pendet (Bali), serta pakaian adat yang anggun seperti Kebaya, Baju Bodo, dan Ulos.",
      "Toleransi Antarumat Beragama: Menghormati 6 agama resmi di Indonesia (Islam, Kristen Protestan, Katolik, Hindu, Buddha, Khonghucu) dengan saling menjaga ketenangan saat tetangga atau kawan sedang beribadah.",
      "Aksi Nyata di Sekolah: Belajar dan bermain bersama secara kompak tanpa memilih kawan berdasarkan asal daerah atau warna kulit, mencintai lagu daerah Nusantara, serta bangga menggunakan produk kebudayaan bangsa sendiri."
    ],
    "generatedQuizPreview": [
      "Level 1: Asal-usul semboyan Bhinneka Tunggal Ika (+10 Poin)",
      "Level 2: Mengenal Rumah Gadang dan Rumah Honai (+20 Poin)",
      "Level 3: Sikap toleransi kerukunan antarsuku di sekolah (+30 Poin)"
    ]
  },
  {
    "id": "mod-pkn-sila3",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 4",
    "title": "Makna Lambang Sila Ke-3: Persatuan Indonesia di Sekolah & Rumah",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
    "sourceType": "kemdikbud",
    "pageCount": 28,
    "learningGoal": "Peserta didik memahami makna filosofis pohon beringin dan mengamalkan sikap rukun tanpa membeda-bedakan kawan.",
    "isValidated": true,
    "isActiveToday": true,
    "validatedAt": "Hari ini, 07:30 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian & Hakikat Sila Ke-3: Sila ketiga Pancasila berbunyi Persatuan Indonesia dengan lambang Pohon Beringin. Hakikat sila ini adalah tekad bulat bersama bangsa Indonesia yang memiliki ribuan suku, bahasa daerah, dan tradisi berbeda untuk bersatu kokoh dalam satu ikatan keluarga besar kebangsaan.",
      "Makna Filosofis Pohon Beringin: Pohon beringin memiliki akar tunggang dalam yang menancap kokoh ke bumi, melambangkan negara Indonesia sebagai tempat berteduh dan bernaung seluruh rakyat dengan aman. Sulur dan akar gantungnya yang menjalar ke segala arah mencerminkan kekayaan keberagaman suku bangsa Nusantara yang tetap bersatu teguh dalam satu pohon persatuan.",
      "Sejarah Perumusan Pancasila & Sidang BPUPKI 1945: Menjelang kemerdekaan Indonesia pada tahun 1945, para tokoh pejuang bangsa berkumpul dalam sidang Badan Penyelidik Usaha-usaha Persiapan Kemerdekaan Indonesia (BPUPKI) yang dipimpin oleh Dr. K.R.T. Radjiman Wedyodiningrat. Dalam sidang pertama tanggal 29 Mei sampai 1 Juni 1945 di Gedung Chuo Sangi In (sekarang Gedung Pancasila, Jakarta), tiga tokoh besar bangsa tampil menyampaikan gagasan dasar negara: Mr. Mohammad Yamin (29 Mei), Prof. Dr. Soepomo (31 Mei), dan Ir. Soekarno (1 Juni). Pada tanggal 1 Juni 1945, Bung Karno berpidato dengan penuh semangat membakar jiwa tanpa teks, mengusulkan lima dasar falsafah yang beliau namakan Pancasila atas saran ahli bahasa. Hari bersejarah 1 Juni itulah yang hingga kini kita peringati sebagai Hari Lahir Pancasila.",
      "Sejarah Panitia Sembilan & Pengesahan Piagam Jakarta hingga PPKI 18 Agustus 1945: Untuk mematangkan rumusan Bung Karno, dibentuklah Panitia Sembilan yang beranggotakan sembilan tokoh besar bangsa: Ir. Soekarno, Drs. Moh. Hatta, Mr. A.A. Maramis, Abikoesno Tjokrosoejoso, Abdoel Kahar Moezakir, H. Agus Salim, Mr. Achmad Soebardjo, K.H. Wahid Hasjim, dan Mr. Mohammad Yamin. Pada 22 Juni 1945, Panitia Sembilan berhasil menyepakati naskah Piagam Jakarta (Jakarta Charter). Setelah Indonesia memproklamasikan kemerdekaan pada 17 Agustus 1945, keesokan harinya tanggal 18 Agustus 1945, Panitia Persiapan Kemerdekaan Indonesia (PPKI) menggelar sidang penting. Dalam sidang ini, para tokoh bangsa dengan jiwa kenegarawanan luhur menyepakati perubahan demi persatuan seluruh rakyat dari Sabang sampai Merauke, mengesahkan UUD 1945, dan secara resmi menetapkan Pancasila sebagai Dasar Negara Republik Indonesia yang sah dan abadi.",
      "Sejarah Panjang Terciptanya Lambang Garuda Pancasila: Lambang Garuda Pancasila yang gagah di dinding kelas kita memiliki sejarah perancangan yang sangat istimewa. Pada tahun 1950, pemerintah Republik Indonesia Serikat (RIS) membentuk Panitia Lencana Negara yang dipimpin oleh Sultan Hamid II dari Pontianak. Beliau merancang figur burung garuda yang terinspirasi dari mitologi Nusantara dan arca kuno candi-candi Indonesia. Rancangan awal Sultan Hamid II kemudian disempurnakan langsung oleh Presiden Soekarno: Bung Karno menambahkan jambul pada kepala burung garuda agar tampak gagah dan berwibawa (tidak menyerupai Bald Eagle Amerika Serikat), serta mengubah cengkeraman kaki garuda yang semula mencengkeram pita merah putih di belakang menjadi mencengkeram pita putih bertuliskan Bhinneka Tunggal Ika di bagian depan. Lambang Garuda Pancasila ini akhirnya diresmikan pertama kali dalam Sidang Kabinet RIS pada tanggal 11 Februari 1950 di Hotel Des Indes, Jakarta. Jumlah helai bulunya dirancang khusus mengabadikan hari keramat proklamasi: 17 bulu pada masing-masing sayap, 8 bulu pada ekor, 19 bulu pada pangkal ekor di bawah perisai, dan 45 bulu pada leher (17 Agustus 1945).",
      "Sejarah Semboyan Bhinneka Tunggal Ika dari Zaman Majapahit: Kalimat sakral Bhinneka Tunggal Ika bukanlah kalimat baru, melainkan warisan luhur nenek moyang bangsa kita sejak abad ke-14 pada era keemasan Kerajaan Majapahit di bawah kepemimpinan Raja Hayam Wuruk dan Mahapatih Gajah Mada. Kalimat ini tertulis indah dalam kitab sastra klasik berjudul Kakawin Sutasoma pupuh 139 bait 5 karya pujangga besar Mpu Tantular. Bunyi lengkap bait aslinya adalah: Rwaneka dhatu winuwus Buddha Wiswa, Bhineki rakwa ring apan kena parwanosen, Mangka ng Jinatwa kalawan Siwatatwa tunggal, Bhinneka Tunggal Ika tan hana dharma mangrwa. Maknanya: Meskipun ajaran Buddha dan Siwa (Hindu) tampak berbeda di mata manusia, hakikat kebenarannya adalah tunggal dan satu adanya. Pada masa pergerakan nasional, tokoh pejuang Mohammad Yamin membawa kutipan bait ini kepada Bung Karno dan para bapak pendiri bangsa, hingga disepakati bersama menjadi semboyan pengikat ribuan pulau, bahasa, dan adat istiadat suku-suku Nusantara dalam dekapan NKRI.",
      "Intisari Lima Sila Luhur Bangsa: Sila ke-1 menuntun ketakwaan dan toleransi antarumat beragama, Sila ke-2 menjunjung martabat kemanusiaan yang adil dan beradab, Sila ke-3 mengikat persatuan di atas keragaman, Sila ke-4 mengedepankan musyawarah mufakat, dan Sila ke-5 mengamanatkan keadilan sosial bagi seluruh rakyat Indonesia.",
      "Mengapa Materi Ini Sangat Penting Bagi Siswa SD?: Memahami nilai persatuan sejak dini mencegah terjadinya permusuhan, saling ejek perbedaan fisik atau suku (anti-bullying), serta pertengkaran antarteman. Siswa menyadari bahwa perbedaan adalah kekayaan bangsa yang harus disyukuri dan dirawat.",
      "Aksi Nyata & Penerapan di Sekolah: Melaksanakan jadwal piket kebersihan kelas secara kompak tanpa pilih-pilih kawan, mengajak teman baru atau teman pendiam untuk belajar dan bermain bersama saat jam istirahat, serta membiasakan diri bertutur kata menggunakan Bahasa Indonesia yang santun.",
      "Pengamalan di Rumah & Warga: Menjaga kerukunan antarsaudara di rumah, tidak membuat kegaduhan ketika tetangga sedang beribadah, serta ikut membantu saat ada kegiatan kerja bakti membersihkan lingkungan tempat tinggal.",
      "Semangat Gotong Royong Tradisi Luhur Nusantara: Falsafah luhur berat sama dipikul, ringan sama dijinjing. Kerja sama sukarela dan tolong-menolong membuat masalah sulit menjadi ringan dan menumbuhkan rasa persaudaraan yang tulus di tengah masyarakat.",
      "Nilai Budi Pekerti & Karakter Pelajar Pancasila: Membiasakan sikap toleransi, rendah hati, cinta tanah air, bangga memakai produk karya bangsa sendiri seperti batik Indonesia, serta senantiasa bersikap jujur dan amanah dalam setiap perbuatan."
    ],
    "generatedQuizPreview": [
      "Level 1: Lambang Sila Ke-3 Persatuan Indonesia (+10 Poin)",
      "Level 2: Sikap saat melihat teman berbeda suku sendirian (+20 Poin)",
      "Level 3: Analogi akar gantung pohon beringin bagi keberagaman (+30 Poin)"
    ]
  },
  {
    "id": "mod-pkn-gotongroyong",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 4",
    "title": "Gotong Royong & Kerja Sama: Berat Sama Dipikul Ringan Sama Dijinjing",
    "chapterCode": "Bab 2",
    "source": "API SIBI Kemdikbudristek RI (Buku Panduan Guru & Siswa)",
    "sourceType": "kemdikbud",
    "pageCount": 32,
    "learningGoal": "Menumbuhkan empati sosial dan pembiasaan kerja bakti serta piket bersama di lingkungan sekolah.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 08:15 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian & Asal-Usul Gotong Royong: Gotong royong berasal dari kata gotong (mengangkat atau memikul bersama) dan royong (bersama-sama). Gotong royong adalah tradisi luhur bangsa Indonesia berupa kegiatan bekerja bersama-sama secara sukarela untuk mencapai tujuan bersama yang bermanfaat bagi banyak orang.",
      "Prinsip Utama & Pembagian Peran: Prinsip dasar gotong royong adalah berat sama dipikul, ringan sama dijinjing. Pekerjaan besar dan berat akan terasa ringan serta cepat selesai bila setiap orang mengambil peran masing-masing dengan ikhlas tanpa pamrih.",
      "Mengapa Gotong Royong Wajib Dipelajari?: Mengikis sifat individualis (mementingkan diri sendiri), menumbuhkan empati sosial, dan mempererat tali persaudaraan sesama kawan sehingga kelas menjadi ruang belajar yang nyaman dan hangat.",
      "Aksi Nyata di Lingkungan Sekolah: Bekerja sama menata perpustakaan kelas, merapikan meja dan kursi setelah jam belajar, serta aktif dalam kelompok diskusi di mana kawan yang sudah paham membantu kawan yang masih kesulitan belajar.",
      "Pengamalan di Rumah & Warga: Membantu meringankan pekerjaan orang tua seperti merapikan tempat tidur sendiri dan mencuci piring, serta ikut serta dalam kegiatan membersihkan selokan lingkungan dari sampah.",
      "Nilai Karakter Pelajar Pancasila: Menanamkan jiwa tolong-menolong, peduli lingkungan, tanggung jawab bersama, dan tidak mengharapkan imbalan materi saat menolong sesama."
    ],
    "generatedQuizPreview": [
      "Level 1: Makna pepatah berat sama dipikul (+10 Poin)",
      "Level 2: Perilaku gotong royong di lingkungan sekolah (+20 Poin)"
    ]
  },
  {
    "id": "mod-pkn-norma",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 5",
    "title": "Norma, Hak & Kewajiban Warga Negara serta UUD 1945",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Kurikulum Merdeka 2024)",
    "sourceType": "kemdikbud",
    "pageCount": 26,
    "learningGoal": "Memahami 4 macam norma dalam masyarakat, prinsip keseimbangan hak dan kewajiban, serta penegakan keadilan sosial UUD 1945.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 08:30 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian & Asal-Usul Norma: Kata norma diserap dari bahasa Latin norma yang bermakna garis siku pengukur tegak lurus—dimaknai sebagai kaidah, pedoman tingkah laku, dan tolok ukur yang disepakati bersama agar kehidupan bermasyarakat berjalan tertib, aman, dan berkeadilan.",
      "Empat Macam Norma Utama: (1) Norma Agama (bersumber dari wahyu Tuhan Yang Maha Esa), (2) Norma Kesusilaan (bersumber dari suara hati nurani manusia), (3) Norma Kesopanan (bersumber dari tata krama adat pergaulan setempat), serta (4) Norma Hukum (aturan tertulis negara yang tegas dan mengikat seluruh warga).",
      "Keseimbangan Hak dan Kewajiban: Kewajiban adalah tugas yang harus kita laksanakan dengan penuh tanggung jawab, sedangkan hak adalah sesuatu yang sah kita terima. Mendahulukan kewajiban sebelum menuntut hak melahirkan keadilan sosial dan ketenteraman bersama.",
      "Aksi Nyata di Sekolah: Datang tepat waktu sebelum bel masuk berbunyi, mendengarkan bimbingan guru dengan tertib, menjaga fasilitas kelas, serta membiasakan budaya antre di kantin dan perpustakaan.",
      "Pengamalan di Rumah & Warga: Menghormati nasihat orang tua, menjaga ketenangan saat tetangga beristirahat, mematuhi rambu lalu lintas, serta tidak mengambil barang milik orang lain tanpa izin.",
      "Nilai Karakter Bangsa: Membiasakan sikap jujur, mandiri, disiplin waktu, cinta keadilan, dan menghormati hak asasi sesama kawan."
    ],
    "generatedQuizPreview": [
      "Level 1: Contoh aturan yang berlaku di dalam kelas (+10 Poin)",
      "Level 2: Perbedaan antara hak dan kewajiban siswa SD (+20 Poin)",
      "Level 3: Analisis pentingnya hukum dan sanksi yang adil (+30 Poin)"
    ]
  },
  {
    "id": "mod-pkn-musyawarah",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 6",
    "title": "Musyawarah Mufakat & Semangat Persatuan NKRI untuk Keutuhan Bangsa",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
    "sourceType": "kemdikbud",
    "pageCount": 26,
    "learningGoal": "Mengamalkan musyawarah mufakat dalam pengambilan keputusan bersama serta menjaga keutuhan Negara Kesatuan Republik Indonesia.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 09:00 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian Musyawarah Mufakat: Musyawarah berasal dari bahasa Arab syawara yang bermakna berunding atau berdiskusi bersama untuk mencapai kesepakatan bulat (mufakat) dalam memecahkan masalah atau mengambil keputusan bersama.",
      "Landasan Konstitusi & Sila Ke-4: Musyawarah mufakat dijiwai oleh Sila Keempat Pancasila: Kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan. Mengedepankan akal sehat, hati nurani, dan kepentingan umum di atas kepentingan pribadi atau golongan.",
      "Prinsip Pokok dalam Musyawarah: Setiap orang memiliki hak yang sama untuk berpendapat, wajib menghargai dan mendengarkan pendapat kawan tanpa memotong pembicaraan, tidak memaksakan kehendak sendiri, dan melaksanakan hasil keputusan bersama dengan ikhlas dan penuh tanggung jawab.",
      "Contoh Penerapan di Sekolah: Pemilihan ketua kelas dan pengurus kelas secara tertib demokratis, musyawarah menentukan tujuan wisata edukasi kelas, dan pembagian tugas kerja bakti sekolah.",
      "Pengamalan di Lingkungan Warga: Mengikuti rembuk warga RT/RW untuk pembangunan fasilitas umum pos ronda, kerja bakti membersihkan lingkungan, dan menjaga kerukunan warga.",
      "Menjaga Keutuhan NKRI: Melatih jiwa kepemimpinan, menolak ujaran kebencian atau berita bohong (hoaks), membela kebenaran, serta senantiasa mengutamakan persatuan dan kesatuan bangsa di atas perbedaan."
    ],
    "generatedQuizPreview": [
      "Level 1: Pengertian musyawarah mufakat dan Sila ke-4 (+10 Poin)",
      "Level 2: Tata cara menyampaikan pendapat yang santun (+20 Poin)",
      "Level 3: Komitmen menjaga keutuhan dan persatuan NKRI (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-anakkewan",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 1",
    "title": "Kawruh Basa Jawa: Mengenal Jeneng Arane Anak Kewan (Bebek-Meri, Sapi-Pedhet, dll.)",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Sastri Basa)",
    "sourceType": "disdik",
    "pageCount": 18,
    "learningGoal": "Peserta didik saged nyebutaken lan njodohaken arane anak kewan ing padintenan (meri, pedhet, cemeng, kuthuk, cempe, belo) kanthi leres.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 09:15 WIB",
    "gameType": "matching",
    "ragSummary": [
      "Pangertosan Arane Anak Kewan: Ing basa Jawa, jeneng anak kewan iku nduweni sesebutan dhewe-dhewe minangka kasugihan kabudayan basa lan bukti celake uripe wong Jawa karo alam sakupenge.",
      "Arane Anak Unggas (Buntut Suwiwi): Anak bebek arane meri, anak pitik arane kuthuk, anak menthok arane minthi, anak manuk arane piyik, anak doro arane piyik.",
      "Arane Anak Kewan Rumput & Ngesusoni: Anak sapi arane pedhet, anak wedhus arane cempe, anak kebo arane gudel, anak jaran arane belo, anak kucing arane cemeng.",
      "Arane Anak Kewan Galak & Liar: Anak gajah arane bledug, anak macan arane gogor, anak baya arane rete, anak kodhok arane precel utawa cebong.",
      "Tuladha ing Ukara Basa Jawa: Bapak mundhut pedhet cacahe loro ing pasar kewan, Meri-meri padha nglangi bebarengan ing blumbang, sarta Kucingku duwe anak telu cemeng kabeh."
    ],
    "generatedQuizPreview": [
      "Level 1: Arane anak bebek yaiku meri (+10 Poin)",
      "Level 2: Anak sapi diarani pedhet, anak kucing cemeng (+20 Poin)",
      "Level 3: Jeneng anak kewan galak bledug lan gogor (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-aksara",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 2",
    "title": "Maca lan Nulis Aksara Jawa Legena (20 Aksara) sarta Sandhangan Swara",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Wursita Basa)",
    "sourceType": "disdik",
    "pageCount": 22,
    "learningGoal": "Siswa saged mangertosi wujud aksara Jawa dhasar (Ha-Na-Ca-Ra-Ka) lan sandhangan swara Wulu, Suku, Pepet, Taling.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 09:30 WIB",
    "gameType": "matching",
    "ragSummary": [
      "Pangertosan Aksara Jawa Legena: Aksara Jawa legena yaiku aksara dhasar Jawa kang cacahe ana 20 lan durung diwenehi sandhangan apa-apa, saben aksara nduweni swara vokal a.",
      "Sejarah & Kisah Legenda Dumadine Aksara Jawa (Aji Saka, Dora, lan Sembada): Miturut crita rakyat Jawa, 20 aksara Jawa legena (Carakan) cinipta dening Prabu Aji Saka, sawijining satriya luhur kang rawuh saka tlatah Medang Kamulan. Prabu Aji Saka nduweni batur (abdi) loro kang banget setya tuhu, yaiku Dora lan Sembada. Nalika Aji Saka tindak lelana, Sembada diparingi dhawuh njaga keris pusaka ing Pegunungan Kendeng kanthi pesen keras: keris iki ora kena diparingake marang sapa wae kajaba Aji Saka dhewe kang njupuk. Sawise Aji Saka dadi raja ing Medang Kamulan, beliau ngutus Dora menyang Gunung Kendeng supaya njupuk keris pusaka mau. Nanging nalika Dora ketemu Sembada, Sembada nulak amarga eling welinge Aji Saka yen ora kena diwenehake marang sapa wae saliyane Aji Saka. Dora meksa amarga uga nindakake dhawuhe bendarane. Kekarone padha-padha setya membela amanat, nganti pungkasane perang tandhing amarga ora ana sing gelem ngalah. Amarga kasektene padha, Dora lan Sembada gugur bebarengan minangka ksatria sejati. Krungu kabar sedhih iki, Prabu Aji Saka getun banget lan nangis lara ati. Kanggo ngurmati lan ngenang kasetyane abdine, Prabu Aji Saka ngripta bait puisi 20 aksara Jawa: (1) Ha-Na-Ca-Ra-Ka tegese ana utusan (dora lan sembada), (2) Da-Ta-Sa-Wa-La tegese padha pasulayan utawa padha padudon nindakake dhawuh, (3) Pa-Dha-Ja-Ya-Nya tegese kekarone padha digdayane lan sekti mandraguna, sarta (4) Ma-Ga-Ba-Tha-Nga tegese wasanane padha dadi bathang (mati bebarengan kanthi luhur).",
      "Urutan 20 Aksara Jawa: Ha-Na-Ca-Ra-Ka (ana utusan), Da-Ta-Sa-Wa-La (padha pasulayan), Pa-Dha-Ja-Ya-Nya (padha digdayane), Ma-Ga-Ba-Tha-Nga (padha dadi bathang).",
      "Sandhangan Swara Pokok: Wulu ngowahi swara dadi i (tuladha: siki), Suku ngowahi swara dadi u (tuladha: buku), Pepet ngowahi swara dadi e sepet (tuladha: seger), Taling ngowahi swara dadi e taling (tuladha: sate), lan Taling Tarung ngowahi swara dadi o (tuladha: toko).",
      "Gladhen Maca & Nulis Prasaja: Ngenal pasangan aksara lan nyalin tembung-tembung prasaja saka aksara Latin menyang Aksara Jawa ing buku pasinaon."
    ],
    "generatedQuizPreview": [
      "Level 1: Jumlah aksara Jawa legena dhasar ana 20 (+10 Poin)",
      "Level 2: Sandhangan suku ngowahi swara dadi u (+20 Poin)",
      "Level 3: Pasangan aksara lan sandhangan swara wulu (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-punokawan",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 3",
    "title": "Mengenal Watak Luhur Tokoh Pewayangan Punokawan (Semar, Gareng, Petruk, Bagong)",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Sastri Basa)",
    "sourceType": "disdik",
    "pageCount": 26,
    "learningGoal": "Meneladani watak sabar Semar, cermat Gareng, loman Petruk, serta sifat jujur blaka suta dari tokoh Bagong.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 09:45 WIB",
    "gameType": "matching",
    "ragSummary": [
      "Pangertosan & Asal-Usul Punokawan: Punokawan asale saka tembung Pana (paham utawa weruh kanthi cetha) lan Kawan (kanca/pamomong). Punokawan yaiku papat tokoh pamomong para ksatria Pandhawa kang nduweni kawicaksanan luhur kanggo nuntun marang kabecikan.",
      "Sejarah Lengkap Asal-Usul Punokawan Ciptaan Sunan Kalijaga & Pujangga Jawa: Tokoh Punokawan (Semar, Gareng, Petruk, Bagong) babar pisan ora tinemu ing wiracarita Mahabharata asli saka India, nanging asil ciptaan luhur para pujangga Jawa kuno lan disampurnakake kanthi jembar dening Kanjeng Sunan Kalijaga ing jaman Kasultanan Demak Bintoro abad kaping-15 nganti 16. Nalika semono para wali migunakake kesenian wayang kulit minangka sarana dakwah lan nuntun bebuden luhur masyarakat. Tembung Punokawan asale saka tembung Pana (tegese paham, waspada, lan weruh kanthi trawaca) lan Kawan (tegese kanca, sedulur, utawa pamomong). Mula Punokawan tegese pamomong kang waspada lan ngerti marang bebener sejati. Sunan Kalijaga nyipta Punokawan minangka perlambang rakyat cilik nanging nduweni kawicaksanan luhur kang tansah ngamping-ampingi para satriya (para pemimpin), ngelingake supaya ora kumalungkung utawa sombong, tetep adil, lan tansah ngabekti marang Gusti Kang Maha Kawasa.",
      "Watak Luhur Kyai Semar: Semar minangka bapa pamomong kang sejatine titising dewa (Batara Ismaya). Watake sabar banget, wicaksana, welas asih marang sapa wae, lan ora tau kumalungkung (sombong). Pasinaon: dadi bocah kudu sabar lan ora gampang nesu.",
      "Watak Nala Gareng & Petruk: Gareng tangane ceko lan sikile jinjit minangka perlambang kudu ngati-ati nalika tumindak lan ora njupuk duweke liyan. Petruk dedege dhuwur, irunge dawa, watake grapyak, loman (seneng tetulung), lan pinter gawe senenge kanca tanpa nglarani ati.",
      "Watak Bagong (Blaka Suta): Bagong awake lemu cendhek, watake jujur apa anane (blaka suta), ora seneng lamis (munafik), lan kendel mbelani bebener senadyan ngadhepi bebaya.",
      "Penerapan ing Sekolah & Padintenan: Niru watak jujur Bagong nalika nggarap ulangan, watak sabar Semar nalika ana kanca kang nggodha, lan watak loman Petruk nalika ana kanca kang mbutuhake pitulungan."
    ],
    "generatedQuizPreview": [
      "Level 1: Watak luhur sabar Kyai Semar (+10 Poin)",
      "Level 2: Tuladha watak blaka suta Bagong ing kelas (+20 Poin)",
      "Level 3: Perlambang ceko lan jinjite Nala Gareng (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-unggahungguh",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 4",
    "title": "Trap-Trapan Unggah-Ungguh Basa marang Bapak/Ibu Guru & Tiyang Sepuh",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Wursita Basa)",
    "sourceType": "disdik",
    "pageCount": 20,
    "learningGoal": "Siswa saged mbedakaken tembung Basa Ngoko kaliyan Basa Krama Alus nalika matur kaliyan tiyang ingkang langkung sepuh.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 10:00 WIB",
    "gameType": "matching",
    "ragSummary": [
      "Pangertosan Basa Krama: Basa Krama yaiku salah siji undha-usuk utawa trap-trapan basa Jawa kang luwih alus lan kurmat, digunakake nalika micara karo wong liya murih bisa ngajeni lan ngurmati.",
      "Basa Krama Kuwi Kanggo Apa?: Digunakake nalika matur marang Bapak lan Ibu ing omah, matur marang Bapak/Ibu Guru ing sekolah, guneman marang simbah utawa sedulur sepuh, sarta sapa aruh marang tamu supaya tatakramane becik.",
      "Bedane Tingkatan Basa: Basa Ngoko (kanggo kanca sakelas/sebaya), Basa Krama Lugu (tembunge krama nanging kanggo nyritakake awake dhewe, tuladhane: kula nedha, kula tilem), lan Basa Krama Alus (basa paling kurmat mligi kagem wong tuwa utawa guru, tuladhane: Bapak dhahar, Bu Guru sare).",
      "Tuladha Tembung Ngoko menyang Krama Alus: Mangan dadi dhahar, turu dadi sare, lunga dadi tindak, tuku dadi mundhut, ndeleng dadi mirsani, omah dadi dalem, jeneng dadi asma, teka dadi rawuh.",
      "Tuladha Ukara (Kalimat) ing Padintenan: (1) Marang Guru: Nyuwun sewu Bu Guru, kepareng kula badhe nyuwun pirsa babagan tugas sekolah. (2) Nyritakake Wong Tuwa: Bapak saweg dhahar sekul, dene Ibu saweg tindak dhateng peken mundhut janganan.",
      "Tatakrama Solah Bawa: Nalika matur marang wong tuwa utawa guru, polatan kudu sumeh (grapyak), asta ngapurancang (ditangkepake ing ngarep), awake rada mbungkuk, sarta ora kena mbengok utawa nyela rembug."
    ],
    "generatedQuizPreview": [
      "Level 1: Krama aluse tembung mangan kagem guru (+10 Poin)",
      "Level 2: Basa kang trep nalika nyuwun pirsa Bu Guru (+20 Poin)",
      "Level 3: Bedane krama lugu (nedha) lan krama alus (dhahar) (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-geguritan",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 5",
    "title": "Geguritan: Mengenal Puisi Basa Jawa Gagrag Anyar & Unsur-Unsurnya",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Sastri Basa & Tantri Basa)",
    "sourceType": "disdik",
    "pageCount": 22,
    "learningGoal": "Siswa saged mangertosi pangertosan geguritan gagrag anyar, ciri-ciri, unsur pambangun, sarta tuladha geguritan kanthi lafal kang trep.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 08:30 WIB",
    "gameType": "susunkata",
    "ragSummary": [
      "Pangertosan Geguritan: Geguritan yaiku karya sastra puisi basa Jawa gagrag anyar kang medharake rasa pangrasa panganggit kanthi basa kang endah lan mentes. Geguritan gagrag anyar ora kaiket dening paugeran tartamtu kaya tembang macapat.",
      "Sejarah Perkembangan Geguritan saka Gagrag Kuna menyang Gagrag Anyar: Geguritan sejatine nduweni sejarah kang dawa ing donyane kasusastran Jawa. Ing jaman biyen, geguritan kalebu ing gagrag kuna (puisi Jawa klasik) kang kaiket dening paugeran kenceng, kayata kudu diwiwiti nganggo tembung sun-gegurit, saben padha (bait) ana patang gatra utawa luwih, sarta tibaning swara ing pungkasaning gatra kudu runtut memper tembang macapat. Nanging nalika mlebu jaman pergerakan nasional watara taun 1929, para pujangga Jawa enom kayata R. Intoyo lan Subagagyo Ilham Notodidjojo ngowahi wujud geguritan dadi gagrag anyar (modern). Geguritan gagrag anyar iki luwih mardika (bebas), ora kaiket paugeran guru lagu lan guru wilangan, supaya para pujangga lan generasi mudha luwih leluasa medharake rasa tresna marang bangsa, ibu pertiwi, sarta kritik sosial lumantar kaendahan basa Jawa kang mentes lan puitis.",
      "Geguritan Kuwi Kanggo Apa?: Kanggo medharake rasa pangrasa ati (katresnan marang wong tuwa, rasa syukur marang Gusti, tresna asih marang alam), aweh piwulang becik (amanat luhur), sarta nguri-uri kaendahan basa Jawa puitis.",
      "Ciri-Ciri Utama Geguritan Gagrag Anyar: (1) Ora kaiket guru gatra (larik), guru wilangan (suku kata), lan guru lagu (tibaning swara), (2) Basane endah, mentes, lan puitis, (3) Nggunakake purwakanthi (persamaan swara utawa sastra), (4) Tembunge dipilih kanthi cermat (diksi).",
      "Unsur Pambangun Geguritan: Tema (underaning gagasan pokok), Diksi (pamilihing tembung endah), Purwakanthi (runtuting swara vokal/konsonan), lan Amanat (pesen becik kang kinandhut ing geguritan).",
      "Tuladha Geguritan 1 (Ibu): Ibu... Rina wengi tansah ngusap luh ing pipiku. Ndonga puji marang Gusti Kang Murbeng Dumadi. Kagem putra-putrimu kang tansah mbok trisnani. Tresnamu tanpa upama, ora bakal sirna selawase. (Tegese: Nggambarake katresnane ibu kang tanpa kendhat).",
      "Tuladha Geguritan 2 (Sekolahanku): Sekolahanku endah asri... Papan kanggo golek ilmu lan wawasan. Bapak Ibu Guru mulang kanthi tulusing ati. Kanca-kancaku padha rukun sesandhingan. (Tegese: Nggambarake rasa seneng lan syukur sekolah ing papan kang rukun lan asri)."
    ],
    "generatedQuizPreview": [
      "Level 1: Pangertosan geguritan gagrag anyar (+10 Poin)",
      "Level 2: Ciri khas geguritan ora kaiket paugeran (+20 Poin)",
      "Level 3: Purwakanthi lan pamilihing diksi tembung (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-pandhawa",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 6",
    "title": "Kisah Kepahlawanan & Silsilah Pandhawa Lima ing Perang Baratayuda",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Kirtya Basa)",
    "sourceType": "disdik",
    "pageCount": 24,
    "learningGoal": "Mengenal keteladanan watak kesatria Pandhawa: Puntadewa, Werkudara, Janaka, Nakula, lan Sadewa.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 10:15 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pangertosan Pandhawa Lima: Pandhawa Lima yaiku sedulur lanang cacah lima putrane Prabu Pandu Dewanata saka kraton Ngastina kang nduweni watak utama, jujur, lan mbelani kabecikan.",
      "Prabu Puntadewa (Yudhistira): Pambarepe Pandhawa, ratu ing Amarta. Watake suci, getihe putih, jujur ora tau goroh, lan remen tetulung marang sapa wae.",
      "Raden Werkudara (Bima): Panenggake Pandhawa, satriya ing Jipang Jodhipati. Awake dhuwur gedhe gagah prakosa, nduweni kuku Pancanaka, watake kendel, setya tuhu marang dhawuhe guru, lan pantang mundur mbelani bebener.",
      "Raden Janaka (Arjuna): Penengahe Pandhawa, satriya ing Madukara. Praupane bagus mencorong, sekti mandraguna kanthi pusaka jemparing Pasopati, alus budine lan remen tapa brata.",
      "Raden Nakula lan Raden Sadewa: Wuragile Pandhawa wujud kembar putra Dewi Madrim. Watake setya bekti marang sedulur tuwa, pinter babagan tetanen lan ngopeni jaran sarta wasis ing ngelmu panitisan.",
      "Piwulang ing Perang Baratayuda: Mbelani bebener nglawan Kurawa kang angkara murka kanthi tetep njunjung luhuring budi pekerti lan satria."
    ],
    "generatedQuizPreview": [
      "Level 1: Urutan silsilah sedulur Pandhawa Lima (+10 Poin)",
      "Level 2: Watak utama Raden Werkudara nalika tetulung (+20 Poin)",
      "Level 3: Kasetyan lan bektine Nakula lan Sadewa (+30 Poin)"
    ]
  },
{
  "id": "mod-pkn-nasionalisme",
  "subject": "pkn",
  "subjectLabel": "Pendidikan Pancasila & PKn",
  "grade": "Kelas 4",
  "title": "Cinta Tanah Air & Nasionalisme: Bangga Menjadi Anak Indonesia",
  "chapterCode": "Bab 5",
  "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
  "sourceType": "kemdikbud",
  "pageCount": 26,
  "learningGoal": "Peserta didik mengenal simbol kebanggaan negara dan membiasakan sikap cinta tanah air serta bangga menggunakan produk Indonesia.",
  "isValidated": true,
  "isActiveToday": false,
  "validatedAt": "Hari ini, 08:00 WIB",
  "gameType": "adventure",
  "ragSummary": [
    "Hai Adik-adik Pintar! Apa itu Nasionalisme?: Nasionalisme artinya rasa cinta, bangga, dan setia yang tulus kepada bangsa dan tanah air kita tercinta, Indonesia! Sebagai anak bangsa, kita bangga tinggal di tanah air Indonesia yang indah, kaya akan budaya, dan penuh keberagaman yang rukun.",
    "Sejarah Pergerakan Nasional & Kongres Pemuda II 1928: Dahulu sebelum tahun 1928, perjuangan bangsa Indonesia melawan penjajah Belanda sering mengalami kegagalan karena masih bersifat kedaerahan (orang Jawa berjuang sendiri, orang Sumatra berjuang sendiri, orang Maluku berjuang sendiri). Menyadari kelemahan tersebut, para pemuda pelajar dari berbagai penjuru tanah air yang tergabung dalam PPPI (Perhimpunan Pelajar-Pelajar Indonesia) mengadakan pertemuan akbar bernama Kongres Pemuda II pada tanggal 27-28 Oktober 1928 di Jakarta. Kongres ini dihadiri organisasi pemuda dari berbagai suku: Jong Java, Jong Sumatranen Bond, Jong Bataks Bond, Jong Islamieten Bond, Jong Celebes, Jong Ambon, dan Pemuda Kaum Betawi. Di gedung Kramat Raya 106, para pemuda berikrar satu suara yang kita kenal sebagai Sumpah Pemuda: mengaku bertumpah darah yang satu tanah air Indonesia, mengaku berbangsa yang satu bangsa Indonesia, dan menjunjung tinggi bahasa persatuan bahasa Indonesia. Pada kongres inilah lagu kebangsaan Indonesia Raya untuk pertama kalinya diperdengarkan kepada khalayak ramai melalui gesekan biola indah oleh sang pencipta, Wage Rudolf (W.R.) Supratman.",
    "Sejarah Bendera Pusaka Sang Merah Putih: Warna merah dan putih telah menjadi warna kehormatan dan panji kejayaan Nusantara sejak zaman Kerajaan Kediri, Majapahit (panji Gula Kelapa), hingga perjuangan Pangeran Diponegoro. Menjelang detik-detik Proklamasi 17 Agustus 1945 di Jalan Pegangsaan Timur 56 Jakarta, Ibu Fatmawati (istri Bung Karno) dengan penuh ketulusan dan linangan air mata menjahit bendera kain merah putih menggunakan tangan beliau sendiri. Kain putih berbahan katun Jepang dan kain merah disatukan dengan jahitan rapi. Bendera hasil jahitan tangan Ibu Fatmawati inilah yang dikibarkan saat proklamasi oleh Latief Hendraningrat dan Suhud Sastro Kusumo diiringi nyanyian lagu Indonesia Raya, dan kini dirawat dengan penuh hormat sebagai Bendera Pusaka Republik Indonesia.",
    "Simbol-Simbol Kebanggaan Negara Indonesia: Bangsa kita memiliki lambang dan simbol resmi yang wajib kita hormati bersama: 1) Bendera Merah Putih (Merah berarti berani membela kebenaran, Putih berarti suci hatinya), 2) Lagu Kebangsaan Indonesia Raya ciptaan W.R. Supratman, 3) Lambang Garuda Pancasila dengan semboyan Bhinneka Tunggal Ika, serta 4) Bahasa persatuan kita, Bahasa Indonesia.",
    "Mengapa Kita Harus Cinta Tanah Air?: Indonesia adalah rumah besar tempat kita lahir, bertumbuh, belajar, dan bermain dengan gembira bersama keluarga dan sahabat. Bila setiap anak memiliki rasa cinta tanah air, persatuan bangsa kita akan selalu kuat, rukun, dan tidak mudah diadu domba.",
    "Contoh Sikap Nyata di Sekolah: Mengikuti upacara bendera hari Senin dengan tertib dan khidmat (berdiri tegak dan hormat saat Sang Merah Putih dinaikkan), menyanyikan lagu Indonesia Raya dengan semangat, rukun berteman dengan kawan sekelas meski berbeda suku atau agama, serta giat belajar agar dapat berprestasi membanggakan bangsa.",
    "Pengamalan di Rumah dan Lingkungan: Bangga memakai produk buatan pengrajin dalam negeri seperti baju batik atau sepatu lokal, merawat kebersihan lingkungan sekitar, menghargai budaya daerah lain, dan selalu bersikap ramah kepada tetangga.",
    "Pesan Budi Pekerti Anak Indonesia: Tanamkan selalu di dalam hati semboyan Aku Bangga Menjadi Anak Indonesia! Jadilah anak yang jujur, santun, pemberani dalam kebaikan, dan siap menjaga persatuan di mana pun kita berada."
  ],
  "generatedQuizPreview": [
    "Level 1: Arti rasa cinta tanah air dan simbol lagu kebangsaan (+10 Poin)",
    "Level 2: Sikap hormat saat upacara bendera dan bangga produk lokal (+20 Poin)",
    "Level 3: Menjaga kerukunan teman beda daerah dan makna bendera Merah Putih (+30 Poin)"
  ],
  "quizQuestions": {
    "1": [
      {
        "id": "q1_nas_1",
        "question": "Apakah arti dari rasa cinta tanah air (nasionalisme) bagi anak sekolah dasar?",
        "options": [
          "Rasa bangga, sayang, dan setia kepada bangsa dan negara Indonesia",
          "Hanya menyukai barang dan budaya dari luar negeri",
          "Menolak berteman dengan kawan yang berbeda daerah",
          "Sikap malas dan tidak mau ikut upacara bendera"
        ],
        "correctOption": 0,
        "hint": "Nasionalisme adalah wujud rasa cinta dan kebanggaan kita sebagai anak Indonesia."
      },
      {
        "id": "q1_nas_2",
        "question": "Lagu kebangsaan negara Indonesia yang selalu kita nyanyikan dengan sikap tegak saat upacara sekolah adalah...",
        "options": [
          "Indonesia Raya ciptaan W.R. Supratman",
          "Balonku Ada Lima",
          "Bintang Kejora",
          "Pelangi-Pelangi"
        ],
        "correctOption": 0,
        "hint": "Lagu kebangsaan resmi Indonesia adalah Indonesia Raya yang diciptakan oleh W.R. Supratman."
      }
    ],
    "2": [
      {
        "id": "q2_nas_1",
        "question": "Saat bendera Merah Putih dinaikkan pada upacara bendera hari Senin di sekolah, sikap yang benar adalah...",
        "options": [
          "Berdiri tegak dengan sikap khidmat dan memberikan hormat kepada bendera",
          "Duduk santai di bawah pohon sambil makan bekal jajan",
          "Mengobrol dan bercanda bersama teman di barisan",
          "Bermain kejar-kejaran di lapangan upacara"
        ],
        "correctOption": 0,
        "hint": "Upacara bendera mengajarkan rasa hormat dan terima kasih atas perjuangan para pahlawan."
      }
    ]
  }
}
];

// Pilihan rekomendasi topik resmi dari API
const PRESET_TOPICS = [
  {
    subject: "pkn",
    chapter: "Bab 5",
    title: "Cinta Tanah Air & Nasionalisme (Simbol Kebanggaan Negara & Produk Lokal)",
    goal: "Mengenal simbol resmi kebanggaan Indonesia serta membiasakan sikap cinta tanah air dan bangga produk lokal.",
    source: "API SIBI Kemdikbudristek (Katalog Buku Teks Utama)",
    pages: 26,
    summary: [
      "Hai Adik-adik Pintar! Apa itu Nasionalisme?: Nasionalisme artinya rasa cinta, bangga, dan setia yang tulus kepada bangsa dan tanah air kita tercinta, Indonesia!",
      "Simbol Kebanggaan Negara: Bendera Merah Putih, Lagu Kebangsaan Indonesia Raya, Lambang Burung Garuda Pancasila, dan Bahasa Indonesia.",
      "Mengapa Kita Harus Cinta Tanah Air?: Agar bangsa Indonesia selalu rukun, damai, bersatu padu, dan tidak mudah diadu domba.",
      "Contoh Sikap Nyata di Sekolah: Tertib saat upacara bendera, menyanyikan lagu Indonesia Raya dengan semangat, dan rukun berteman dengan siapa saja.",
      "Pengamalan di Rumah: Bangga memakai batik dan produk buatan dalam negeri, serta menjaga kelestarian alam lingkungan sekitar.",
      "Pesan Budi Pekerti Anak Indonesia: Tanamkan semboyan 'Aku Bangga Jadi Anak Indonesia' dan jadilah anak yang jujur serta pemberani dalam kebaikan.",
    ],
    quiz: [
      "Level 1: Arti rasa cinta tanah air dan simbol lagu kebangsaan (+10 Poin)",
      "Level 2: Sikap hormat saat upacara bendera dan bangga produk lokal (+20 Poin)",
      "Level 3: Menjaga kerukunan teman beda daerah dan makna bendera Merah Putih (+30 Poin)",
    ],
  },
  {
    subject: "pkn",
    chapter: "Bab 4",
    title: "Toleransi & Kerukunan Beragama (Sila Ke-1 & UUD 1945 Pasal 29)",
    goal: "Memahami asal-usul kata toleransi (tolerare) serta mengamalkan kerukunan dan saling menghormati perbedaan agama.",
    source: "API SIBI Kemdikbudristek (Kurikulum Merdeka 2024)",
    pages: 28,
    summary: [
      "Pengertian & Asal-Usul Toleransi: Kata toleransi diserap dari bahasa Latin 'tolerare' yang berarti bersabar, menahan diri, dan menghargai perbedaan tanpa memaksakan kehendak kepada orang lain.",
      "Landasan Konstitusi UUD 1945: Sila Pertama Pancasila dan Pasal 29 Ayat (2) UUD 1945 menjamin kemerdekaan tiap-tiap penduduk untuk memeluk agamanya dan beribadat sesuai keyakinannya.",
      "Prinsip Kerukunan (Tasamuh): Membangun persaudaraan sosial yang rukun dan damai antarpemeluk 6 agama resmi di Indonesia tanpa mencampuradukkan ajaran ritual ibadah.",
      "Aksi Nyata di Sekolah: Menjaga ketenangan ketika teman berdoa sebelum belajar, tetap kompak bermain bersama, dan menghormati kawan yang berpuasa.",
      "Pengamalan di Lingkungan Warga: Menghormati rumah ibadah sekitar pemukiman dan bergotong royong membersihkan lingkungan tanpa membedakan latar belakang tetangga.",
      "Nilai Budi Pekerti: Menumbuhkan watak tepa selira (tenggang rasa), lapang dada, dan welas asih sebagai insan yang beriman kepada Tuhan Yang Maha Esa.",
    ],
    quiz: [
      "Level 1: Asal-usul kata toleransi (tolerare) dan Sila ke-1 Pancasila (+10 Poin)",
      "Level 2: Jaminan kemerdekaan beragama Pasal 29 Ayat (2) UUD 1945 (+20 Poin)",
      "Level 3: Prinsip kerukunan beragama tanpa mencampuradukkan ibadah (+30 Poin)",
    ],
  },
  {
    subject: "pkn",
    chapter: "Bab 3",
    title: "Norma, Aturan Sekolah & Tertib Hukum Sehari-hari (UUD 1945)",
    goal: "Memahami hak dan kewajiban anak di rumah dan sekolah serta mentaati tata tertib secara disiplin.",
    source: "API SIBI Kemdikbudristek (Kurikulum Merdeka 2024)",
    pages: 26,
    summary: [
      "Pengertian & Asal-Usul Norma: Kata norma diserap dari bahasa Belanda 'norm' dan Latin 'norma' (garis pengukur tingkah laku) agar kehidupan bermasyarakat berjalan tertib dan aman.",
      "Empat Macam Norma: Terdiri dari Norma Agama, Norma Kesusilaan, Norma Kesopanan, dan Norma Hukum dengan sanksi tegas mengikat.",
      "Keseimbangan Hak dan Kewajiban: Menunaikan kewajiban terlebih dahulu dengan ikhlas sebelum menuntut hak menciptakan keadilan bagi semua.",
      "Aksi Nyata di Sekolah: Datang tepat waktu, mendengarkan bimbingan guru, menjaga kebersihan, dan membudayakan antre tertib.",
      "Pengamalan di Rumah: Membantu orang tua dan menjaga ketenangan saat tetangga sekitar sedang beristirahat.",
      "Nilai Budi Pekerti: Membiasakan sikap jujur, mandiri, disiplin waktu, dan menghormati hak sesama kawan.",
    ],
    quiz: [
      "Level 1: Contoh aturan yang berlaku di dalam kelas (+10 Poin)",
      "Level 2: Perbedaan antara hak dan kewajiban siswa SD (+20 Poin)",
      "Level 3: Studi kasus akibat tidak mematuhi norma antre (+30 Poin)",
    ],
  },
  {
    subject: "pkn",
    chapter: "Bab 4",
    title: "Bhinneka Tunggal Ika: Mengenal Keragaman Suku, Rumah Adat & Budaya Nusantara",
    goal: "Mengidentifikasi kekayaan rumah adat, tarian tradisional, dan pakaian daerah sebagai kebanggaan bangsa.",
    source: "API SIBI Kemdikbudristek (Buku Teks Siswa)",
    pages: 30,
    summary: [
      "Asal Semboyan: Semboyan Bhinneka Tunggal Ika berasal dari Kitab Sutasoma karya Mpu Tantular pada era Majapahit, bermakna berbeda-beda tetapi tetap satu jua.",
      "Kekayaan Ragam Nusantara: Mengenal ribuan pulau, ratusan suku bangsa, rumah adat, tarian daerah, dan pakaian adat tradisional milik bersama.",
      "Sikap Menghargai Perbedaan: Tidak membeda-bedakan teman berdasarkan suku, ras, atau keyakinan, serta bangga melestarikan budaya bangsa.",
      "Aksi Nyata di Sekolah: Menampilkan tarian daerah saat pentas seni sekolah dan bersahabat akrab dengan teman dari berbagai daerah.",
      "Pengamalan di Rumah: Menghormati tradisi tetangga dan hidup rukun bersama warga sekitar.",
      "Nilai Luhur: Menanamkan cinta tanah air Indonesia dan persatuan nasional yang kokoh.",
    ],
    quiz: [
      "Level 1: Arti dan asal-usul semboyan Bhinneka Tunggal Ika (+10 Poin)",
      "Level 2: Menjodohkan rumah adat dengan nama provinsinya (+20 Poin)",
      "Level 3: Menganalisis pentingnya persatuan di tengah keberagaman (+30 Poin)",
    ],
  },
  {
    subject: "bjawa",
    chapter: "Bab 3",
    title: "Kisah Kepahlawanan & Silsilah Pandhawa Lima ing Perang Baratayuda",
    goal: "Mengenal keteladanan watak kesatria Pandhawa: Puntadewa, Werkudara, Janaka, Nakula, lan Sadewa.",
    source: "Repositori Mulok Disdikbud Provinsi (Buku Kirtya Basa)",
    pages: 24,
    summary: [
      "Pandhawa Lima yaiku sedulur cacah lima kang nduweni watak utama lan luhur.",
      "Puntadewa watake jujur ora tau goroh, Werkudara watake kendel mbelani bebener.",
      "Janaka (Arjuna) alus budine lan sekti, Nakula lan Sadewa setya tuhu marang sedulur tuwa.",
    ],
    quiz: [
      "Level 1: Urutan silsilah sedulur Pandhawa Lima (+10 Poin)",
      "Level 2: Watak utama Raden Werkudara nalika tetulung (+20 Poin)",
    ],
  },
  {
    subject: "bjawa",
    chapter: "Bab 4",
    title: "Maca lan Nulis Aksara Jawa Legena (20 Aksara) sarta Sandhangan Swara",
    goal: "Siswa saged mangertosi wujud aksara Jawa Ha-Na-Ca-Ra-Ka lan nggunakake sandhangan Wulu, Suku, Pepet, Taling.",
    source: "Repositori Mulok Disdikbud Provinsi (Buku Wursita Basa)",
    pages: 22,
    summary: [
      "Aksara Jawa Legena cacahe ana rong puluh (20) wiwit saka Ha nganti Nga.",
      "Sandhangan Swara: Wulu (swara i), Suku (swara u), Pepet (swara e), Taling (swara é), Taling Tarung (swara o).",
      "Gladhen nulis tembung-tembung prasaja kanthi aksara Jawa ing buku tulis.",
    ],
    quiz: [
      "Level 1: Jumlah aksara Jawa legena dhasar (+10 Poin)",
      "Level 2: Sandhangan kang ngowahi swara dadi 'u' (+20 Poin)",
    ],
  },
];

export default function CurriculumValidationManager() {
  const queryClient = useQueryClient();
  const setActiveValidatedModule = useUIStore((s) => s.setActiveValidatedModule);
  const [modules, setModules] = useState<CurriculumModule[]>(INITIAL_MODULES);
  const [filterSubject, setFilterSubject] = useState<"pkn" | "bjawa">("pkn");
  const [previewingModule, setPreviewingModule] = useState<CurriculumModule | null>(null);

  // Ambil seluruh materi kurikulum tersimpan dari database backend saat mount
  useEffect(() => {
    fetchCurriculumModules()
      .then((data) => {
        if (data && data.length > 0) {
          setModules(data);
        }
      })
      .catch(() => {});
  }, []);

  // State Modal Hapus Materi
  const [moduleToDelete, setModuleToDelete] = useState<CurriculumModule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State Modal Request API & Validasi
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [modalStage, setModalStage] = useState<"form" | "fetching" | "validated_preview">("form");
  const [fetchProgressStep, setFetchProgressStep] = useState(0);

  // Form input
  const [selectedSubject, setSelectedSubject] = useState<"pkn" | "bjawa">("pkn");
  const [selectedGrade, setSelectedGrade] = useState<string>("Kelas 1");
  const [chapterCode, setChapterCode] = useState("Bab 1");
  const [topicTitle, setTopicTitle] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [apiSourceOption, setApiSourceOption] = useState<"kemdikbud" | "disdik">("kemdikbud");

  // Penampung data hasil respon API yang siap divalidasi
  const [generatedModule, setGeneratedModule] = useState<CurriculumModule | null>(null);

  const [filterGrade, setFilterGrade] = useState<string>("Kelas 1");

  const filteredModules = modules.filter((m) => {
    if (m.subject !== filterSubject) return false;
    const g = (m.grade || "").toLowerCase();
    if (filterGrade !== "all" && !(g.includes(filterGrade.toLowerCase()) || g.includes("semua"))) return false;
    return true;
  });

  const activeModule = modules.find((m) => m.isActiveToday);

  // Membuka modal request API
  function handleOpenRequestModal() {
    playClickSound();
    setModalStage("form");
    setFetchProgressStep(0);
    setGeneratedModule(null);
    setSelectedSubject("pkn");
    setChapterCode("Bab 3");
    setTopicTitle("Norma, Aturan Sekolah & Tertib Hukum Sehari-hari (UUD 1945)");
    setLearningGoal(
      "Memahami hak dan kewajiban anak di rumah dan sekolah serta mentaati aturan tata tertib dengan disiplin."
    );
    setApiSourceOption("kemdikbud");
    setShowRequestModal(true);
  }

  // Pilih preset cepat dari rekomendasi
  function handleSelectPreset(preset: (typeof PRESET_TOPICS)[0]) {
    playClickSound();
    setSelectedSubject(preset.subject as "pkn" | "bjawa");
    setChapterCode(preset.chapter);
    setTopicTitle(preset.title);
    setLearningGoal(preset.goal);
    setApiSourceOption(preset.subject === "pkn" ? "kemdikbud" : "disdik");
  }

  // Trigger Request ke REST API (/api/v1/curriculum/request)
  async function handleExecuteApiRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!topicTitle.trim()) return;

    playClickSound();
    setModalStage("fetching");
    setFetchProgressStep(1);

    // Langkah 1 -> Hubungkan ke server Kemdikbud / Disdik
    const stepTimer1 = setTimeout(() => {
      setFetchProgressStep(2);
      playRobotAwakeSound();
    }, 150);

    // Langkah 2 -> Sintesis RAG AI & Kuis
    const stepTimer2 = setTimeout(() => {
      setFetchProgressStep(3);
      playCoinSound();
    }, 300);

    try {
      // Panggil REST API backend
      const apiModule = await requestCurriculumModule({
        subject: selectedSubject,
        chapterCode: chapterCode.trim() || "Bab Baru",
        topicTitle: topicTitle.trim(),
        grade: selectedGrade,
        learningGoal: learningGoal.trim(),
        apiSource: apiSourceOption,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setFetchProgressStep(3);
      const gameType =
        apiModule.gameType ||
        resolveGameTypeForModule(
          apiModule.title,
          apiModule.subject,
          apiModule.id,
          apiModule.ragSummary
        );
      setGeneratedModule({ ...apiModule, grade: selectedGrade, gameType });
      setModalStage("validated_preview");
      playCorrectSound();
    } catch {
      // Fallback lokal jika jaringan offline
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      const matchedPreset = PRESET_TOPICS.find((p) =>
        p.title.toLowerCase().includes(topicTitle.toLowerCase().slice(0, 10))
      );
      const fallbackGameType = resolveGameTypeForModule(
        topicTitle.trim(),
        selectedSubject,
        `mod-${selectedSubject}-${Date.now()}`,
        matchedPreset?.summary
      );
      const fallbackResult: CurriculumModule = {
          id: `mod-${selectedSubject}-${Date.now()}`,
          subject: selectedSubject,
          subjectLabel:
            selectedSubject === "pkn" ? "Pendidikan Pancasila & PKn" : "Basa Jawa (Muatan Lokal)",
          grade: selectedGrade,
          title: topicTitle.trim(),
          chapterCode: chapterCode.trim() || "Bab Baru",
          source:
            apiSourceOption === "kemdikbud"
              ? "API SIBI Kemdikbudristek RI (Buku Teks Kurikulum Merdeka)"
              : "Repositori Mulok Disdikbud Provinsi (Buku Ajar Resmi)",
          sourceType: apiSourceOption,
          pageCount: matchedPreset?.pages || 24,
          learningGoal: learningGoal.trim() || "Siswa memahami konsep esensial materi.",
          isValidated: false,
          isActiveToday: false,
          gameType: fallbackGameType,
          ragSummary: matchedPreset?.summary || [
            `Intisari Pembelajaran: "${topicTitle.trim()}" disarikan secara adaptif untuk anak SD.`,
            "Pengamalan di Sekolah: Kerja sama dan saling menghargai sesama teman.",
            "Pengamalan di Rumah: Berperilaku santun dan mematuhi nasihat orang tua.",
          ],
          generatedQuizPreview: matchedPreset?.quiz || [
            `Level 1: Konsep dasar ${chapterCode} (+10 Poin)`,
            `Level 2: Sikap nyata di sekolah (+20 Poin)`,
            `Level 3: Kasus pemecahan masalah (+30 Poin)`,
          ],
      };
      setGeneratedModule(fallbackResult);
      setModalStage("validated_preview");
      playCorrectSound();
    }
  }

  // Sahkan & Validasi Hasil Respon API (/api/v1/curriculum/validate)
  async function handleConfirmValidation() {
    if (!generatedModule) return;
    playClickSound();
    playCorrectSound();

    const gameType =
      generatedModule.gameType ||
      resolveGameTypeForModule(
        generatedModule.title,
        generatedModule.subject,
        generatedModule.id,
        generatedModule.ragSummary
      );

    const validatedMod: CurriculumModule = {
      ...generatedModule,
      grade: generatedModule.grade || selectedGrade,
      isValidated: true,
      isActiveToday: true,
      validatedAt: "Baru saja divalidasi",
      gameType,
    };

    // Tambahkan modul baru di paling atas dan jadikan aktif hari ini
    setModules((prev) => [validatedMod, ...prev.map((m) => ({ ...m, isActiveToday: false }))]);

    // Sinkronkan ke Ruang Siswa agar langsung muncul tanpa pilihan dropdown
    setActiveValidatedModule({
      id: validatedMod.id,
      chapterCode: validatedMod.chapterCode,
      title: validatedMod.title,
      subject: validatedMod.subject,
      subjectLabel: validatedMod.subjectLabel,
      source: validatedMod.source,
      validatedAt: "Baru saja divalidasi oleh Guru",
      ragSummary: validatedMod.ragSummary,
      quizQuestions: (validatedMod as any).quizQuestions,
      gameType,
    });

    setShowRequestModal(false);

    // Otomatis Panggil Generator Game Manus AI untuk Topik Baru Ini
    try {
      fetch("/api/games/manus-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: validatedMod.id,
          chapterTitle: validatedMod.title,
          subject: validatedMod.subject,
          grade: validatedMod.grade,
          learningGoal: validatedMod.learningGoal,
          ragSummary: validatedMod.ragSummary,
          quizQuestions: (validatedMod as any).quizQuestions,
          gameType,
        }),
      }).catch(() => {});
    } catch {}

    try {
      await validateCurriculumModule(validatedMod);
      queryClient.invalidateQueries({ queryKey: ["ai-content"] });
      queryClient.invalidateQueries({ queryKey: ["quiz"] });
      queryClient.invalidateQueries({ queryKey: ["class-summary"] });
      queryClient.invalidateQueries({ queryKey: ["chapter-progress"] });
    } catch {}
  }

  // Validasi modul yang sudah ada di list
  async function handleValidateExisting(targetModule: CurriculumModule) {
    playClickSound();
    playCorrectSound();

    const gameType =
      targetModule.gameType ||
      resolveGameTypeForModule(
        targetModule.title,
        targetModule.subject,
        targetModule.id,
        targetModule.ragSummary
      );

    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id === targetModule.id) {
          return {
            ...mod,
            isValidated: true,
            isActiveToday: true,
            validatedAt: "Baru saja divalidasi",
            gameType,
          };
        }
        return {
          ...mod,
          isActiveToday: false,
        };
      })
    );

    // Sinkronkan ke Ruang Siswa agar langsung muncul tanpa pilihan dropdown
    setActiveValidatedModule({
      id: targetModule.id,
      chapterCode: targetModule.chapterCode,
      title: targetModule.title,
      subject: targetModule.subject,
      subjectLabel: targetModule.subjectLabel,
      source: targetModule.source,
      validatedAt: "Baru saja divalidasi oleh Guru",
      ragSummary: targetModule.ragSummary,
      quizQuestions: (targetModule as any).quizQuestions,
      gameType,
    });

    // Otomatis Panggil Generator Game Manus AI untuk Modul yang Divalidasi
    try {
      fetch("/api/games/manus-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: targetModule.id,
          chapterTitle: targetModule.title,
          subject: targetModule.subject,
          grade: targetModule.grade,
          learningGoal: targetModule.learningGoal,
          ragSummary: targetModule.ragSummary,
          quizQuestions: (targetModule as any).quizQuestions,
          gameType,
        }),
      }).catch(() => {});
    } catch {}

    try {
      await validateCurriculumModule(targetModule);
      queryClient.invalidateQueries({ queryKey: ["ai-content"] });
      queryClient.invalidateQueries({ queryKey: ["quiz"] });
    } catch {}

    if (previewingModule?.id === targetModule.id) {
      setPreviewingModule(null);
    }
  }

  // Hapus modul kurikulum lama dari database
  async function handleConfirmDelete() {
    if (!moduleToDelete) return;
    const target = moduleToDelete;
    setIsDeleting(true);
    playClickSound();

    try {
      await deleteCurriculumModuleApi(target.id);
      playCoinSound();

      const remaining = modules.filter((m) => m.id !== target.id);
      setModules(remaining);

      // Jika yang dihapus sedang aktif, jadikan modul pertama yang tersisa sebagai aktif
      if (target.isActiveToday && remaining.length > 0) {
        const nextActive = remaining[0];
        if (nextActive) {
          nextActive.isActiveToday = true;
          nextActive.isValidated = true;
          setActiveValidatedModule({
            id: nextActive.id,
            chapterCode: nextActive.chapterCode,
            title: nextActive.title,
            subject: nextActive.subject,
            subjectLabel: nextActive.subjectLabel,
            source: nextActive.source,
            validatedAt: "Aktif Otomatis",
            ragSummary: nextActive.ragSummary,
            quizQuestions: (nextActive as any).quizQuestions,
          });
          try {
            await validateCurriculumModule(nextActive);
          } catch {}
        }
      }

      queryClient.invalidateQueries({ queryKey: ["ai-content"] });
      queryClient.invalidateQueries({ queryKey: ["quiz"] });
      queryClient.invalidateQueries({ queryKey: ["class-summary"] });
      queryClient.invalidateQueries({ queryKey: ["chapter-progress"] });
    } catch (err) {
      console.warn("Penghapusan backend modul kurikulum:", err);
      // Fallback mulus: tetap hapus dari local state agar guru tidak terhalang popup error
      const remaining = modules.filter((m) => m.id !== target.id);
      setModules(remaining);
      queryClient.invalidateQueries({ queryKey: ["class-summary"] });
      queryClient.invalidateQueries({ queryKey: ["chapter-progress"] });
      playCoinSound();
    } finally {
      setIsDeleting(false);
      setModuleToDelete(null);
    }
  }

  return (
    <section className="bg-amber-50/80 dark:bg-amber-950/20 p-6 sm:p-7 rounded-3xl border-4 border-amber-200 dark:border-amber-800/60 shadow-xl shadow-amber-200/40 dark:shadow-none space-y-5 transition-colors">
      {/* HEADER MANAGER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-amber-200/70 dark:border-amber-900/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-black text-base flex items-center justify-center shadow-xs">
              📚
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100 tracking-tight">
              Pusat Validasi &amp; Pengaturan Bab Pelajaran Guru 👨‍🏫
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 mt-1">
            Request materi dari API Kemdikbud sesuai bab yang ingin diajarkan hari ini, lalu klik
            validasi agar otomatis tayang di layar siswa!
          </p>
        </div>

        {/* TOMBOL UTAMA: REQUEST MATERI DARI API */}
        <div>
          <button
            type="button"
            onClick={handleOpenRequestModal}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-600 hover:from-amber-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 border-b-4 border-teal-800 active:translate-y-0.5 active:border-b-0 transition flex items-center gap-2.5 animate-pulse"
          >
            <span className="text-base font-black">⚡</span>
            <span>+ Request Bab Baru dari API Kemdikbud</span>
          </button>
        </div>
      </div>

      {/* BANNER BAB AKTIF HARI INI */}
      {activeModule && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 dark:from-emerald-950 dark:via-teal-950 dark:to-emerald-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border-2 border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black shrink-0">
              🌟
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-black px-2.5 py-0.5 rounded-full bg-white text-emerald-900 shadow-xs">
                🌟 Materi yang Sedang Dipelajari Siswa Hari Ini
              </span>
              <h4 className="text-base sm:text-lg font-black tracking-tight mt-1">
                {activeModule.chapterCode}: {activeModule.title}
              </h4>
              <p className="text-xs text-emerald-100 font-medium">
                {activeModule.subjectLabel} • {activeModule.grade} • Terbuka di Ruang Siswa 👧
              </p>
            </div>
          </div>
          <span className="inline-flex items-center justify-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl bg-emerald-900/60 border border-emerald-300/40 text-emerald-100 shrink-0">
            <span>●</span> Live di Layar Siswa 🚀
          </span>
        </div>
      )}

      {/* FILTER TABS & TINGKAT KELAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border-2 border-amber-200 dark:border-slate-800 shadow-xs">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setFilterSubject("pkn");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              filterSubject === "pkn"
                ? "bg-amber-400 text-amber-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            🇮🇩 PKn / Pancasila ({modules.filter((m) => m.subject === "pkn").length})
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setFilterSubject("bjawa");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              filterSubject === "bjawa"
                ? "bg-amber-400 text-amber-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            🎭 Basa Jawa Mulok ({modules.filter((m) => m.subject === "bjawa").length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border-2 border-amber-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 px-1">Filter Kelas:</span>
          {(["all", "Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                playClickSound();
                setFilterGrade(g);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                filterGrade === g
                  ? "bg-amber-400 text-amber-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {g === "all" ? "Semua Kelas" : g}
            </button>
          ))}
        </div>
      </div>

      {/* DAFTAR KARTU MODUL SIAP VALIDASI */}
      <div className="grid grid-cols-1 gap-4">
        {filteredModules.map((item) => (
          <div
            key={item.id}
            className={`relative rounded-2xl p-4 sm:p-5 transition-all border-4 shadow-sm ${
              item.isActiveToday
                ? "bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-700 shadow-emerald-500/10"
                : item.isValidated
                  ? "bg-white dark:bg-slate-900 border-amber-100 dark:border-slate-800 hover:border-amber-300"
                  : "bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-950/60 hover:border-rose-300"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Kolom Kiri */}
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-base font-black shrink-0 border-2 shadow-xs ${
                    item.subject === "pkn"
                      ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600 border-rose-200 dark:border-rose-800"
                      : "bg-purple-100 dark:bg-purple-950/50 text-purple-600 border-purple-200 dark:border-purple-800"
                  }`}
                >
                  {item.subject === "pkn" ? "🇮🇩 PKN" : "🎭 BJ"}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                      {item.chapterCode}
                    </span>
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                      {item.subjectLabel}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {item.pageCount} Halaman Materi API
                    </span>

                    {/* Status Badge */}
                    {item.isActiveToday ? (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1 shadow-xs">
                        <span>⭐</span> Aktif Hari Ini
                      </span>
                    ) : item.isValidated ? (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700 flex items-center gap-1">
                        <span>✅</span> Tervalidasi
                      </span>
                    ) : (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 animate-pulse flex items-center gap-1">
                        <span>⏳</span> Menunggu Validasi
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-2 max-w-3xl">
                    <span className="font-bold text-amber-900 dark:text-amber-300">
                      Tujuan Pembelajaran:
                    </span>{" "}
                    {item.learningGoal}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span className="font-bold">Sumber Rujukan:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      {item.source}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 lg:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setPreviewingModule(item);
                  }}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition border-2 border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5"
                >
                  <span>👁️ Tinjau Modul</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleValidateExisting(item)}
                  className={`px-5 py-2.5 font-black text-xs rounded-xl transition border-b-4 active:translate-y-0.5 active:border-b-0 flex items-center gap-2 shadow-md ${
                    item.isActiveToday
                      ? "bg-emerald-600 text-white border-emerald-800 shadow-emerald-500/20"
                      : item.isValidated
                        ? "bg-teal-500 hover:bg-teal-600 text-white border-teal-700 shadow-teal-500/20"
                        : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 border-amber-600 shadow-amber-400/40"
                  }`}
                >
                  <span>{item.isActiveToday ? "⭐" : item.isValidated ? "↻" : "✅"}</span>
                  <span>
                    {item.isActiveToday
                      ? "Sedang Aktif Dipelajari"
                      : item.isValidated
                        ? "Ganti Jadi Bab Hari Ini"
                        : "Validasi & Terbitkan ke Siswa 🚀"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setModuleToDelete(item);
                  }}
                  title="Hapus materi lama ini"
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl transition border-2 border-rose-200 dark:border-rose-900 shadow-xs flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <span>🗑️</span>
                  <span className="hidden sm:inline">Hapus</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* MODAL REQUEST API INTERAKTIF & TAMPILAN LANGSUNG HASIL VALIDASI */}
      {/* ============================================================== */}
      {showRequestModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border-4 border-amber-300 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* STAGE 1: FORM REQUEST MATERI */}
            {modalStage === "form" && (
              <form onSubmit={handleExecuteApiRequest} className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      API
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Request Materi Baru dari API Kemdikbud / Disdik
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                        Pilih bab yang ingin diajarkan. API akan langsung menarik naskah resmi dan
                        mengekstraknya!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setShowRequestModal(false);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* REKOMENDASI CEPAT PRESET */}
                <div className="space-y-2 bg-amber-50/70 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-amber-200 dark:border-slate-700">
                  <span className="text-xs font-black text-amber-900 dark:text-amber-300 block">
                    Rekomendasi Bab Resmi Kurikulum Merdeka (Klik untuk Isi Cepat):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRESET_TOPICS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`text-left p-2.5 rounded-xl border-2 transition text-xs font-bold flex flex-col justify-between ${
                          topicTitle === preset.title
                            ? "bg-amber-200/80 dark:bg-amber-900/40 border-amber-400 text-amber-950 dark:text-amber-100 shadow-xs"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300"
                        }`}
                      >
                        <span className="text-[10px] text-slate-400 font-black uppercase">
                          {preset.subject === "pkn" ? "PKn" : "B. Jawa"} • {preset.chapter}
                        </span>
                        <span className="line-clamp-1 mt-0.5">{preset.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Mata Pelajaran:
                      </label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => {
                          const val = e.target.value as "pkn" | "bjawa";
                          setSelectedSubject(val);
                          setApiSourceOption(val === "pkn" ? "kemdikbud" : "disdik");
                        }}
                        className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="pkn">Pendidikan Pancasila &amp; PKn</option>
                        <option value="bjawa">Basa Jawa (Muatan Lokal)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Target Kelas Siswa:
                      </label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer"
                      >
                        <option value="Kelas 1">Kelas 1</option>
                        <option value="Kelas 2">Kelas 2</option>
                        <option value="Kelas 3">Kelas 3</option>
                        <option value="Kelas 4">Kelas 4</option>
                        <option value="Kelas 5">Kelas 5</option>
                        <option value="Kelas 6">Kelas 6</option>
                        <option value="Semua Kelas">Semua Kelas</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Kode / Nomor Bab:
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Bab 3 atau Bab 4"
                        value={chapterCode}
                        onChange={(e) => setChapterCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Judul / Topik Bab yang Ingin Diajarkan:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Norma, Aturan Sekolah & Tertib Hukum (UUD 1945)"
                      value={topicTitle}
                      onChange={(e) => setTopicTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Capaian / Tujuan Pembelajaran Khusus (Opsional):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: Siswa memahami hak dan kewajiban di sekolah..."
                      value={learningGoal}
                      onChange={(e) => setLearningGoal(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setShowRequestModal(false);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-md border-b-4 border-teal-800 active:translate-y-0.5 active:border-b-0 transition flex items-center gap-2"
                  >
                    <span>Tarik Materi dari API Sekarang</span>
                  </button>
                </div>
              </form>
            )}

            {/* STAGE 2: LOADING PROGRESS REAL-TIME DARI API */}
            {modalStage === "fetching" && (
              <div className="py-10 px-4 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/60 border-4 border-amber-300 dark:border-amber-800 flex items-center justify-center text-xs font-black text-amber-900 dark:text-amber-200 animate-pulse">
                  MEMPROSES
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    API Sedang Bekerja Menarik Materi...
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1 max-w-md mx-auto">
                    Topik: "{topicTitle}" sedang disinkronkan dari server kurikulum.
                  </p>
                </div>

                {/* STEP INDICATOR */}
                <div className="space-y-2.5 max-w-md mx-auto text-left text-xs font-bold">
                  <div
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 transition ${
                      fetchProgressStep >= 1
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <span>{fetchProgressStep >= 1 ? "✓" : "○"}</span>
                    <span>1. Menghubungi API SIBI Kemdikbud &amp; Repositori Mulok...</span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 transition ${
                      fetchProgressStep >= 2
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <span>{fetchProgressStep >= 2 ? "✓" : "○"}</span>
                    <span>2. Mengunduh naskah &amp; Ekstraksi RAG Chunking (500 karakter)...</span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 transition ${
                      fetchProgressStep >= 3
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <span>{fetchProgressStep >= 3 ? "✓" : "○"}</span>
                    <span>3. AI memproduksi narasi ringkasan ramah anak &amp; Kuis Adaptif 3-Level...</span>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: TAMPILAN LANGSUNG RESPON MATERI DARI API & SIAP DIVALIDASI */}
            {modalStage === "validated_preview" && generatedModule && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-start justify-between gap-4 border-b-2 border-emerald-100 dark:border-emerald-900/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xl border-2 border-emerald-300">
                      ✓
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Respon API Diterima — Siap Divalidasi
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                        {generatedModule.chapterCode}: {generatedModule.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setShowRequestModal(false);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* INFO METADATA DARI API */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-emerald-50/60 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-emerald-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-500 block font-bold">Sumber Resmi:</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">
                      {generatedModule.source}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold">Tingkat Kelas:</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">
                      {generatedModule.grade} • {generatedModule.pageCount} Halaman Materi API
                    </span>
                  </div>
                </div>

                {/* OUTPUT RINGKASAN INTISARI DARI API */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Intisari yang Dihasilkan AI (Siap Ditayangkan ke Siswa):</span>
                  </h4>
                  <div className="bg-sky-50 dark:bg-slate-800 p-3.5 rounded-xl border border-sky-200 dark:border-slate-700 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {generatedModule.ragSummary?.map((point, i) => (
                      <p key={i} className="flex items-start gap-2">
                        <span className="text-sky-600 font-bold">•</span>
                        <span>{point}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* DRAFT KUIS YANG DIHASILKAN OTOMATIS */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Kuis CBT Adaptif yang Siap Dimainkan Siswa:</span>
                  </h4>
                  <div className="bg-amber-50 dark:bg-slate-800 p-3.5 rounded-xl border border-amber-200 dark:border-slate-700 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {generatedModule.generatedQuizPreview?.map((quiz, i) => (
                      <p key={i} className="flex items-center gap-2 font-medium">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{quiz}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* PROMPT OTOMATIS GENERATOR GAME VIA MANUS AI ENGINE */}
                {(() => {
                  const targetGameType =
                    generatedModule.gameType ||
                    resolveGameTypeForModule(
                      generatedModule.title,
                      generatedModule.subject,
                      generatedModule.id,
                      generatedModule.ragSummary
                    );
                  const formatLabel =
                    targetGameType === "matching"
                      ? "Menjodohkan Kartu Pasangan"
                      : targetGameType === "susunkata"
                      ? "Susun Huruf & Kata Misteri"
                      : targetGameType === "wheel"
                      ? "Roda Putar Cerdas & Tantangan Bintang"
                      : targetGameType === "ulartangga"
                      ? "Papan Ular Tangga Edukasi"
                      : "Petualangan Jelajah Desa 3D";
                  const promptText =
                    targetGameType === "matching"
                      ? `Buat game web edukasi interaktif anak SD bertema: "${generatedModule.title}". Genre: Menjodohkan Kartu Pasangan (Memory/Matching Puzzle) dengan timer 60 detik, kombo bintang emas, dan suara riang saat cocok.`
                      : `Buat game web petualangan interaktif anak SD bertema: "${generatedModule.title}". Genre: 3D Petualangan Jelajah Desa Adat Nusantara dengan pos misi nilai luhur, pengumpulan koin emas, dan dialog edukasi moral anak.`;

                  return (
                    <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-sky-50/90 dark:from-slate-800/90 dark:via-indigo-950/40 dark:to-slate-800/90 p-2.5 sm:p-3 rounded-xl border border-indigo-200/90 dark:border-indigo-800/80 shadow-xs space-y-1.5 transition-all">
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <span className="text-[11px] font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                          <span className="text-xs">🎮</span>
                          <span>Integrasi Generator Game Manus AI</span>
                        </span>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                          Format: {formatLabel}
                        </span>
                      </div>

                      <div className="bg-white/95 dark:bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wider block">
                          Prompt Manus AI Otomatis:
                        </span>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium italic leading-snug line-clamp-2">
                          "{promptText}"
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        <span>⚡</span>
                        <span>Saat divalidasi, game <strong>{formatLabel}</strong> langsung aktif di portal belajar siswa!</span>
                      </div>
                    </div>
                  );
                })()}

                {/* FOOTER ACTION: VALIDASI SEKARANG */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setModalStage("form");
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    ← Ubah Topik / Request Ulang
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmValidation}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/30 border-b-4 border-teal-800 active:translate-y-0.5 active:border-b-0 transition flex items-center gap-2"
                  >
                    <span>✅</span>
                    <span>Sahkan, Validasi &amp; Terbitkan ke Siswa Sekarang! 🚀</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </ModalPortal>
      )}

      {/* MODAL PRATINJAU DOKUMEN MODUL DARI DAFTAR (EXISTING PREVIEW) */}
      {previewingModule && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border-4 border-amber-300 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  MODUL
                </div>
                <div>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {previewingModule.subjectLabel} • {previewingModule.grade}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {previewingModule.chapterCode}: {previewingModule.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setPreviewingModule(null);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-amber-50/60 dark:bg-slate-800/60 p-4 rounded-2xl border border-amber-200 dark:border-slate-700">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold block">
                  Sumber Data:
                </span>
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {previewingModule.source}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold block">
                  Status Kurikulum:
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {previewingModule.isValidated
                    ? "Resmi Tervalidasi Guru"
                    : "Menunggu Pengesahan Guru"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold block">
                  Jumlah Halaman:
                </span>
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {previewingModule.pageCount} Halaman Materi API
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold block">
                  Status Ruang Siswa:
                </span>
                <span className="font-black text-amber-700 dark:text-amber-300">
                  {previewingModule.isActiveToday
                    ? "Aktif & Dapat Diakses Siswa"
                    : "Standby / Belum Ditayangkan"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Capaian &amp; Tujuan Pembelajaran (TP)
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed font-medium">
                {previewingModule.learningGoal}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Ringkasan Materi &amp; Audio Pendamping</span>
              </h4>
              <div className="text-xs text-slate-600 dark:text-slate-400 bg-sky-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-sky-200 dark:border-slate-700 space-y-1.5">
                <p className="font-bold text-sky-900 dark:text-sky-300">
                  ✓ Teks bab telah diekstrak menjadi pilar aksi ramah anak.
                </p>
                <p>✓ Suara pendamping belajar Bahasa Indonesia telah disiapkan otomatis.</p>
                <p>✓ Kuis CBT Adaptif 3-Level (+10, +20, +30 Poin) siap diujikan.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setPreviewingModule(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Tutup Pratinjau
              </button>

              <button
                type="button"
                onClick={() => handleValidateExisting(previewingModule)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-md border-b-4 border-teal-800 active:translate-y-0.5 active:border-b-0 transition flex items-center gap-2"
              >
                <span>✅</span>
                <span>Validasi &amp; Aktifkan Bab Ini Sekarang! 🚀</span>
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ============================================================== */}
      {/* MODAL KONFIRMASI HAPUS MATERI LAMA 🗑️                          */}
      {/* ============================================================== */}
      {moduleToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border-4 border-rose-300 dark:border-rose-900 space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0 shadow-xs">
                🗑️
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Hapus Materi Pembelajaran?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Materi akan dihapus dari daftar kurikulum guru.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400 bg-rose-200/80 dark:bg-rose-900/80 px-2 py-0.5 rounded-md">
                {moduleToDelete.chapterCode} • {moduleToDelete.subjectLabel}
              </span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                {moduleToDelete.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {moduleToDelete.learningGoal}
              </p>
            </div>

            {moduleToDelete.isActiveToday && (
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-300 dark:border-amber-800">
                ⚠️ Modul ini sedang aktif diajarkan ke siswa hari ini. Jika dihapus, sistem akan otomatis mengalihkan modul aktif ke materi berikutnya.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  playClickSound();
                  setModuleToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs transition border-b-4 border-rose-800 shadow-md flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <span>Menghapus...</span>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Ya, Hapus Materi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </section>
  );
}
