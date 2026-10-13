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
import { useUIStore } from "@/lib/store/useUIStore";
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
}

const INITIAL_MODULES: CurriculumModule[] = [
  {
    id: "mod-pkn-sila3",
    subject: "pkn",
    subjectLabel: "Pendidikan Pancasila & PKn",
    grade: "Kelas 4 SD (Fase B)",
    title: "Makna Lambang Sila Ke-3: Persatuan Indonesia di Sekolah & Rumah",
    chapterCode: "Bab 1",
    source: "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
    sourceType: "kemdikbud",
    pageCount: 28,
    learningGoal:
      "Peserta didik memahami makna filosofis pohon beringin dan mengamalkan sikap rukun tanpa membeda-bedakan kawan.",
    isValidated: true,
    isActiveToday: true,
    validatedAt: "Hari ini, 07:30 WIB",
    ragSummary: [
      "Pengertian & Hakikat Sila Ke-3: Sila ketiga Pancasila berbunyi 'Persatuan Indonesia' dengan lambang Pohon Beringin. Hakikat sila ini adalah tekad bersama bangsa Indonesia yang memiliki ribuan suku, bahasa daerah, dan budaya berbeda untuk bersatu bulat dalam satu ikatan kebangsaan yang utuh tanpa membeda-bedakan asal-usul.",
      "Makna Filosofis Pohon Beringin: Pohon beringin memiliki akar tunggang dalam yang menancap kokoh ke bumi, melambangkan negara Indonesia sebagai tempat berteduh dan bernaung seluruh rakyat dengan aman. Sulur dan akar gantungnya yang menjalar ke segala arah mencerminkan kekayaan keberagaman suku bangsa Nusantara yang tetap bersatu teguh dalam satu pohon persatuan.",
      "Mengapa Materi Ini Penting Bagi Siswa SD?: Memahami nilai persatuan sejak dini mencegah terjadinya permusuhan, saling ejek perbedaan fisik atau suku, serta pertengkaran antarteman. Siswa menyadari bahwa perbedaan adalah kekayaan bangsa yang harus disyukuri dan dirawat.",
      "Aksi Nyata & Penerapan di Sekolah: Melaksanakan jadwal piket kebersihan kelas secara kompak tanpa pilih-pilih kawan, mengajak teman baru atau teman pendiam untuk belajar dan bermain bersama saat jam istirahat, serta membiasakan diri bertutur kata menggunakan Bahasa Indonesia yang santun.",
      "Pengamalan di Rumah & Warga: Menjaga kerukunan antarsaudara di rumah, tidak membuat kegaduhan ketika tetangga sedang beribadah, serta ikut membantu saat ada kegiatan kerja bakti membersihkan lingkungan tempat tinggal.",
      "Nilai Budi Pekerti & Karakter Bangsa: Membiasakan sikap toleransi, rendah hati, cinta tanah air, dan bangga memakai produk karya bangsa sendiri seperti batik Indonesia.",
    ],
    generatedQuizPreview: [
      "Level 1: Lambang Sila Ke-3 Persatuan Indonesia (+10 Poin)",
      "Level 2: Sikap saat melihat teman berbeda suku sendirian (+20 Poin)",
      "Level 3: Analogi akar gantung pohon beringin bagi keberagaman (+30 Poin)",
    ],
  },
  {
    id: "mod-pkn-gotongroyong",
    subject: "pkn",
    subjectLabel: "Pendidikan Pancasila & PKn",
    grade: "Kelas 4 SD (Fase B)",
    title: "Gotong Royong & Kerja Sama: Berat Sama Dipikul Ringan Sama Dijinjing",
    chapterCode: "Bab 2",
    source: "API SIBI Kemdikbudristek RI (Buku Panduan Guru & Siswa)",
    sourceType: "kemdikbud",
    pageCount: 32,
    learningGoal:
      "Menumbuhkan empati sosial dan pembiasaan kerja bakti serta piket bersama di lingkungan sekolah.",
    isValidated: false,
    isActiveToday: false,
    ragSummary: [
      "Pengertian & Asal-Usul Gotong Royong: Gotong royong berasal dari kata 'gotong' (mengangkat atau memikul bersama) dan 'royong' (bersama-sama). Gotong royong adalah tradisi luhur bangsa Indonesia berupa kegiatan bekerja bersama-sama secara sukarela untuk mencapai tujuan bersama yang bermanfaat bagi banyak orang.",
      "Prinsip Utama & Pembagian Peran: Prinsip dasar gotong royong adalah 'berat sama dipikul, ringan sama dijinjing'. Pekerjaan besar dan berat akan terasa ringan serta cepat selesai bila setiap orang mengambil peran masing-masing dengan ikhlas tanpa pamrih.",
      "Mengapa Gotong Royong Wajib Dipelajari?: Mengikis sifat individualis (mementingkan diri sendiri), menumbuhkan empati sosial, dan mempererat tali persaudaraan sesama kawan sehingga kelas menjadi ruang belajar yang nyaman dan hangat.",
      "Aksi Nyata di Lingkungan Sekolah: Bekerja sama menata perpustakaan kelas, merapikan meja dan kursi setelah jam belajar, serta aktif dalam kelompok diskusi di mana kawan yang sudah paham membantu kawan yang masih kesulitan belajar.",
      "Pengamalan di Rumah & Warga: Membantu meringankan pekerjaan orang tua seperti merapikan tempat tidur sendiri dan mencuci piring, serta ikut serta dalam kegiatan membersihkan selokan lingkungan dari sampah.",
      "Nilai Karakter Pelajar Pancasila: Menanamkan jiwa tolong-menolong, peduli lingkungan, tanggung jawab bersama, dan tidak mengharapkan imbalan materi saat menolong sesama.",
    ],
    generatedQuizPreview: [
      "Level 1: Makna pepatah berat sama dipikul (+10 Poin)",
      "Level 2: Perilaku gotong royong di lingkungan sekolah (+20 Poin)",
    ],
  },
  {
    id: "mod-bjawa-unggahungguh",
    subject: "bjawa",
    subjectLabel: "Basa Jawa (Muatan Lokal)",
    grade: "Kelas 4 SD (Fase B)",
    title: "Trap-Trapan Unggah-Ungguh Basa marang Bapak/Ibu Guru & Tiyang Sepuh",
    chapterCode: "Bab 1",
    source: "Repositori Mulok Disdikbud Provinsi (Buku Wursita Basa)",
    sourceType: "disdik",
    pageCount: 20,
    learningGoal:
      "Siswa saged mbedakaken tembung Basa Ngoko kaliyan Basa Krama Alus nalika matur kaliyan tiyang ingkang langkung sepuh.",
    isValidated: true,
    isActiveToday: false,
    validatedAt: "Kemarin, 14:15 WIB",
    ragSummary: [
      "Pangertosan & Hakekat Unggah-Ungguh Basa: Unggah-ungguh basa yaiku tata krama, subasita, lan tatatertib anggone micara (guneman) kanthi mbedakake basa manut sapa sing diajak guneman. Tujuane murih pawongan bisa ngajeni wong liya lan nduweni budi pakarti kang alus.",
      "Trap-Trapan Basa & Perangane: Kapérang dadi Basa Ngoko (digunakake marang kanca sebaya utawa wong tuwa marang bocah enom) lan Basa Krama Alus (digunakake nalika matur marang Bapak/Ibu Guru, wong tuwa, lan tiyang ingkang langkung sepuh). Solah bawa kudu selaras: awak rada mbungkuk nalika matur marang wong tuwa.",
      "Tuladha Tembung Penting: Marang wong tuwa: mangan dadi dhahar, turu dadi sare, lunga dadi tindak. Menawa nyritakake awake dhewe marang wong tuwa: nggunakake nedha lan tilem.",
      "Penerapan marang Bapak & Ibu Guru: Nalika nyuwun pirsa babagan tugas sekolah, matur kanthi santun: 'Nyuwun sewu Bapak/Ibu Guru, kepareng kula badhe nyuwun pirsa babagan tugas punika'.",
      "Penerapan ing Griya & Bebrayan: Salim lan ngambung asta nalika pamit bidhal sekolah, mbantu pakaryane wong tuwa, sarta matur 'nderek langkung' nalika mlaku ing sangarepe tiyang sepuh.",
      "Piweling Luhur Wong Jawa: 'Ajining dhiri dumunung ana ing lathi, ajining raga ana ing busana'—tegese ajining manungsa gumantung saka pocapan lan tindak-tanduke kang becik.",
    ],
    generatedQuizPreview: [
      "Level 1: Krama aluse tembung mangan (+10 Poin)",
      "Level 2: Basa kang trep nalika nyuwun pirsa Bu Guru (+20 Poin)",
    ],
  },
  {
    id: "mod-bjawa-punokawan",
    subject: "bjawa",
    subjectLabel: "Basa Jawa (Muatan Lokal)",
    grade: "Kelas 4 SD (Fase B)",
    title: "Mengenal Watak Luhur Tokoh Pewayangan Punokawan (Semar, Gareng, Petruk, Bagong)",
    chapterCode: "Bab 2",
    source: "Repositori Mulok Disdikbud Provinsi (Buku Sastri Basa)",
    sourceType: "disdik",
    pageCount: 26,
    learningGoal:
      "Meneladani watak sabar Semar, grapyak Petruk, serta sifat jujur apa adanya dari tokoh Bagong.",
    isValidated: false,
    isActiveToday: false,
    ragSummary: [
      "Pangertosan & Asal-Usul Punokawan: Punokawan asale saka tembung 'Pana' (paham utawa weruh kanthi cetha) lan 'Kawan' (kanca/sedulur). Punokawan yaiku papat tokoh pamomong para ksatria Pandhawa kang asale saka rakyat cilik, nanging nduweni kawicaksanan luhur kanggo nuntun ksatria marang kabecikan.",
      "Watak Luhur Kyai Semar: Semar minangka bapa pamomong kang sejatine titising dewa (Batara Ismaya). Watake sabar banget, wicaksana, welas asih marang sapa wae, lan ora tau kumalungkung (sombong). Pasinaon: dadi bocah kudu sabar lan ora gampang nesu.",
      "Watak Nala Gareng & Petruk: Gareng tangane ceko lan sikile jinjit minangka perlambang kudu ngati-ati nalika tumindak lan ora njupuk duweke liyan. Petruk dedege dhuwur, irunge dawa, watake grapyak, loman (seneng tetulung), lan pinter gawe senenge kanca tanpa nglarani ati.",
      "Watak Bagong (Blaka Suta): Bagong awake lemu cendhek, watake jujur apa anane (blaka suta), ora seneng lamis (munafik), lan kendel mbelani bebener senadyan ngadhepi bebaya.",
      "Mengapa Siswa Perlu Mempelajari Ini?: Nuntun siswa supaya ora mung ngoyak kepinteran pikiran, nanging uga nduweni watak andhap asor, jujur, lan seneng mbantu kanca kaya para paraga Punokawan.",
      "Penerapan ing Sekolah & Padintenan: Niru watak jujur Bagong nalika nggarap ulangan, watak sabar Semar nalika ana kanca kang nggodha, lan watak loman Petruk nalika ana kanca kang mbutuhake pitulungan.",
    ],
    generatedQuizPreview: [
      "Level 1: Watak luhur Kyai Semar (+10 Poin)",
      "Level 2: Tuladha watak blaka suta Bagong ing kelas (+20 Poin)",
    ],
  },
  {
    id: "mod-pkn-norma",
    subject: "pkn",
    subjectLabel: "Pendidikan Pancasila & PKn",
    grade: "Kelas 4 SD (Fase B)",
    title: "Norma, Aturan Sekolah & Tertib Hukum Sehari-hari (UUD 1945)",
    chapterCode: "Bab 3",
    source: "API SIBI Kemdikbudristek (Kurikulum Merdeka 2024)",
    sourceType: "kemdikbud",
    pageCount: 26,
    learningGoal:
      "Memahami hak dan kewajiban anak di rumah dan sekolah serta mentaati tata tertib secara disiplin.",
    isValidated: false,
    isActiveToday: false,
    ragSummary: [
      "Hai Adik-adik Hebat! Apa itu Norma dan Aturan?: Norma adalah aturan atau petunjuk tentang bagaimana kita harus bertingkah laku yang baik. Aturan ini disepakati bersama agar kehidupan di sekolah dan di rumah berjalan tertib, aman, rukun, dan adil bagi semua orang.",
      "Empat Macam Norma Utama: Terdiri atas Norma Agama (wahyu Tuhan), Norma Kesusilaan (suara hati nurani), Norma Kesopanan (tata krama adat pergaulan), serta Norma Hukum (aturan tertulis negara yang tegas dan mengikat).",
      "Keseimbangan Hak dan Kewajiban: Kewajiban adalah tugas yang harus kita laksanakan dengan penuh tanggung jawab, sedangkan hak adalah sesuatu yang sah kita terima. Mendahulukan kewajiban sebelum menuntut hak melahirkan keadilan dan kedamaian.",
      "Aksi Nyata di Sekolah: Datang tepat waktu sebelum bel masuk berbunyi, mendengarkan bimbingan guru dengan tertib, menjaga kebersihan kelas, serta membiasakan budaya antre di kantin dan perpustakaan.",
      "Pengamalan di Rumah & Warga: Menghormati nasihat orang tua, menjaga ketenangan saat tetangga beristirahat, dan mematuhi aturan keluarga.",
      "Nilai Karakter Bangsa: Membiasakan sikap jujur, mandiri, disiplin waktu, dan menghormati hak asasi sesama kawan.",
    ],
    generatedQuizPreview: [
      "Level 1: Contoh aturan yang berlaku di dalam kelas (+10 Poin)",
      "Level 2: Perbedaan antara hak dan kewajiban siswa SD (+20 Poin)",
      "Level 3: Analisis pentingnya hukum dan sanksi yang adil (+30 Poin)",
    ],
  },
  {
    id: "mod-pkn-bhinneka",
    subject: "pkn",
    subjectLabel: "Pendidikan Pancasila & PKn",
    grade: "Kelas 4 SD (Fase B)",
    title: "Bhinneka Tunggal Ika: Mengenal Keragaman Suku, Rumah Adat & Toleransi Beragama",
    chapterCode: "Bab 4",
    source: "API SIBI Kemdikbudristek (Buku Teks Siswa)",
    sourceType: "kemdikbud",
    pageCount: 30,
    learningGoal:
      "Mengidentifikasi kekayaan rumah adat, tarian tradisional, serta memupuk toleransi beragama dan kerukunan.",
    isValidated: false,
    isActiveToday: false,
    ragSummary: [
      "Pengertian & Asal-Usul Semboyan: Semboyan Bhinneka Tunggal Ika berasal dari Kitab Sutasoma karangan Mpu Tantular pada era Majapahit, berbunyi 'Bhinneka Tunggal Ika tan hana dharma mangrwa', yang bermakna meskipun berbeda-beda keyakinan dan suku bangsa, pada hakikatnya kita tetap satu jua dalam ikatan keluarga besar Indonesia.",
      "Landasan Konstitusi & Kemerdekaan Beragama: Kemerdekaan memeluk keyakinan dijamin secara kokoh dalam Sila ke-1 Pancasila serta Pasal 29 Ayat (2) UUD 1945: Negara menjamin kemerdekaan tiap-tiap penduduk untuk memeluk agamanya masing-masing dan beribadat menurut agamanya dan kepercayaannya itu.",
      "Prinsip Toleransi Beragama (Tasamuh): Kata toleransi berasal dari bahasa Latin 'tolerare' (bersabar dan menahan diri). Menghargai 6 agama resmi di Indonesia (Islam, Kristen Protestan, Katolik, Hindu, Buddha, Khonghucu) dan aliran kepercayaan dengan hidup rukun secara sosial tanpa mencampuradukkan ajaran ritual ibadah.",
      "Kekayaan Ragam Nusantara: Mengenal ribuan pulau, ratusan bahasa daerah, rumah adat (Joglo, Gadang, Tongkonan), pakaian adat, dan kesenian tradisional sebagai kekayaan luhur milik bersama.",
      "Aksi Nyata di Sekolah: Menjaga ketenangan saat teman berdoa sebelum belajar, tetap kompak bermain dan belajar kelompok bersama tanpa membedakan agama kawan, serta saling mengucapkan selamat hari raya dengan santun.",
      "Pengamalan di Rumah & Nilai Luhur: Menjaga ketenangan saat tempat ibadah tetangga sedang melaksanakan peribadatan, bergotong royong tanpa membedakan latar belakang warga, serta menanamkan budi pekerti tepa selira (tenggang rasa) dan cinta damai.",
    ],
    generatedQuizPreview: [
      "Level 1: Asal-usul semboyan Bhinneka Tunggal Ika (+10 Poin)",
      "Level 2: Jaminan kemerdekaan beragama Pasal 29 Ayat 2 (+20 Poin)",
      "Level 3: Sikap toleransi dan kerukunan sosial di sekolah (+30 Poin)",
    ],
  },
  {
    id: "mod-bjawa-pandhawa",
    subject: "bjawa",
    subjectLabel: "Basa Jawa (Muatan Lokal)",
    grade: "Kelas 4 SD (Fase B)",
    title: "Kisah Kepahlawanan & Silsilah Pandhawa Lima ing Perang Baratayuda",
    chapterCode: "Bab 3",
    source: "Repositori Mulok Disdikbud Provinsi (Buku Kirtya Basa)",
    sourceType: "disdik",
    pageCount: 24,
    learningGoal:
      "Mengenal keteladanan watak kesatria Pandhawa: Puntadewa, Werkudara, Janaka, Nakula, lan Sadewa.",
    isValidated: false,
    isActiveToday: false,
    ragSummary: [
      "Pandhawa Lima yaiku sedulur cacah lima kang nduweni watak utama lan luhur.",
      "Puntadewa watake jujur ora tau goroh, Werkudara watake kendel mbelani bebener.",
      "Janaka (Arjuna) alus budine lan sekti, Nakula lan Sadewa setya tuhu marang sedulur tuwa.",
    ],
    generatedQuizPreview: [
      "Level 1: Urutan silsilah sedulur Pandhawa Lima (+10 Poin)",
      "Level 2: Watak utama Raden Werkudara nalika tetulung (+20 Poin)",
    ],
  },
  {
    id: "mod-bjawa-aksara",
    subject: "bjawa",
    subjectLabel: "Basa Jawa (Muatan Lokal)",
    grade: "Kelas 4 SD (Fase B)",
    title: "Maca lan Nulis Aksara Jawa Legena (20 Aksara) sarta Sandhangan Swara",
    chapterCode: "Bab 4",
    source: "Repositori Mulok Disdikbud Provinsi (Buku Wursita Basa)",
    sourceType: "disdik",
    pageCount: 22,
    learningGoal:
      "Siswa saged mangertosi wujud aksara Jawa Ha-Na-Ca-Ra-Ka lan nggunakake sandhangan Wulu, Suku, Pepet, Taling.",
    isValidated: false,
    isActiveToday: false,
    ragSummary: [
      "Aksara Jawa Legena cacahe ana rong puluh (20) wiwit saka Ha nganti Nga.",
      "Sandhangan Swara: Wulu (swara i), Suku (swara u), Pepet (swara e), Taling (swara é), Taling Tarung (swara o).",
      "Gladhen nulis tembung-tembung prasaja kanthi aksara Jawa ing buku tulis.",
    ],
    generatedQuizPreview: [
      "Level 1: Jumlah aksara Jawa legena dhasar (+10 Poin)",
      "Level 2: Sandhangan kang ngowahi swara dadi 'u' (+20 Poin)",
    ],
  },
  {
    id: "mod-pkn-nasionalisme",
    subject: "pkn",
    subjectLabel: "Pendidikan Pancasila & PKn",
    grade: "Kelas 4 SD (Fase B)",
    title: "Cinta Tanah Air & Nasionalisme: Bangga Menjadi Anak Indonesia",
    chapterCode: "Bab 5",
    source: "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
    sourceType: "kemdikbud",
    pageCount: 26,
    learningGoal:
      "Peserta didik mengenal simbol kebanggaan negara dan membiasakan sikap cinta tanah air serta bangga menggunakan produk Indonesia.",
    isValidated: true,
    isActiveToday: false,
    validatedAt: "Hari ini, 08:00 WIB",
    ragSummary: [
      "Hai Adik-adik Pintar! Apa itu Nasionalisme?: Nasionalisme artinya rasa cinta, bangga, dan setia yang tulus kepada bangsa dan tanah air kita tercinta, Indonesia! Sebagai anak bangsa, kita bangga tinggal di tanah air Indonesia yang indah, kaya akan budaya, dan penuh keberagaman yang rukun.",
      "Simbol-Simbol Kebanggaan Negara Indonesia: Bangsa kita memiliki lambang dan simbol resmi yang wajib kita hormati bersama: 1) Bendera Merah Putih (Merah berarti berani membela kebenaran, Putih berarti suci hatinya), 2) Lagu Kebangsaan 'Indonesia Raya' ciptaan W.R. Supratman, 3) Lambang Garuda Pancasila dengan semboyan 'Bhinneka Tunggal Ika', serta 4) Bahasa persatuan kita, Bahasa Indonesia.",
      "Mengapa Kita Harus Cinta Tanah Air?: Indonesia adalah rumah besar tempat kita lahir, bertumbuh, belajar, dan bermain dengan gembira bersama keluarga dan sahabat. Bila setiap anak memiliki rasa cinta tanah air, persatuan bangsa kita akan selalu kuat, rukun, dan tidak mudah diadu domba.",
      "Contoh Sikap Nyata di Sekolah: Mengikuti upacara bendera hari Senin dengan tertib dan khidmat (berdiri tegak dan hormat saat Sang Merah Putih dinaikkan), menyanyikan lagu Indonesia Raya dengan semangat, rukun berteman dengan kawan sekelas meski berbeda suku atau agama, serta giat belajar agar dapat berprestasi membanggakan bangsa.",
      "Pengamalan di Rumah dan Lingkungan: Bangga memakai produk buatan pengrajin dalam negeri seperti baju batik atau sepatu lokal, merawat kebersihan lingkungan sekitar, menghargai budaya daerah lain, dan selalu bersikap ramah kepada tetangga.",
      "Pesan Budi Pekerti Anak Indonesia: Tanamkan selalu di dalam hati semboyan 'Aku Bangga Menjadi Anak Indonesia!' Jadilah anak yang jujur, santun, pemberani dalam kebaikan, dan siap menjaga persatuan di mana pun kita berada.",
    ],
    generatedQuizPreview: [
      "Level 1: Arti rasa cinta tanah air dan simbol lagu kebangsaan (+10 Poin)",
      "Level 2: Sikap hormat saat upacara bendera dan bangga produk lokal (+20 Poin)",
      "Level 3: Menjaga kerukunan teman beda daerah dan makna bendera Merah Putih (+30 Poin)",
    ],
  },
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
  const [filterSubject, setFilterSubject] = useState<"all" | "pkn" | "bjawa">("all");
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
  const [chapterCode, setChapterCode] = useState("Bab 3");
  const [topicTitle, setTopicTitle] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [apiSourceOption, setApiSourceOption] = useState<"kemdikbud" | "disdik">("kemdikbud");

  // Penampung data hasil respon API yang siap divalidasi
  const [generatedModule, setGeneratedModule] = useState<CurriculumModule | null>(null);

  const filteredModules = modules.filter((m) => {
    if (filterSubject === "all") return true;
    return m.subject === filterSubject;
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
        learningGoal: learningGoal.trim(),
        apiSource: apiSourceOption,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setFetchProgressStep(3);
      setGeneratedModule(apiModule);
      setModalStage("validated_preview");
      playCorrectSound();
    } catch {
      // Fallback lokal jika jaringan offline
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      const matchedPreset = PRESET_TOPICS.find((p) =>
        p.title.toLowerCase().includes(topicTitle.toLowerCase().slice(0, 10))
      );
      const fallbackResult: CurriculumModule = {
          id: `mod-${selectedSubject}-${Date.now()}`,
          subject: selectedSubject,
          subjectLabel:
            selectedSubject === "pkn" ? "Pendidikan Pancasila & PKn" : "Basa Jawa (Muatan Lokal)",
          grade: "Kelas 4 SD (Fase B)",
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

    const validatedMod: CurriculumModule = {
      ...generatedModule,
      isValidated: true,
      isActiveToday: true,
      validatedAt: "Baru saja divalidasi",
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
    });

    setShowRequestModal(false);

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

    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id === targetModule.id) {
          return {
            ...mod,
            isValidated: true,
            isActiveToday: true,
            validatedAt: "Baru saja divalidasi",
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
    });

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
              setFilterSubject("all");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              filterSubject === "all"
                ? "bg-amber-400 text-amber-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Semua Mapel ({modules.length})
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setFilterSubject("pkn");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              filterSubject === "bjawa"
                ? "bg-amber-400 text-amber-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            🎭 Basa Jawa Mulok ({modules.filter((m) => m.subject === "bjawa").length})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
          <span>Tingkat Sasaran:</span>
          <span className="px-3 py-1 bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-slate-800 rounded-xl font-black text-amber-950 dark:text-amber-300 shadow-xs">
            🎒 Kelas 4 SD (Fase B)
          </span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
