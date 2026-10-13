// server/data.ts
//
// "Server-side data layer" — mensimulasikan akses langsung ke database /
// RAG Engine. Pada Tugas 7 (Next.js App Router) modul ini adalah lib/data.ts
// dan dipanggil langsung dari React Server Component (async/await tanpa
// round-trip HTTP). Pada Tugas 8 (Vite SPA + Express), TIDAK ADA RSC —
// Vite hanya membundel & menyajikan HTML/CSS/JS statis ke browser, tidak
// pernah mengeksekusi kode di server saat runtime. Karena itu modul ini
// dipindah ke server/ (dijalankan oleh Express/Node) dan SETIAP fungsi di
// bawah diekspos lewat Route Handler REST (server/index.ts), lalu dikonsumsi
// klien lewat TanStack Query — persis pola yang SUDAH dipakai untuk entitas
// Materials & Quiz Questions di Tugas 7. Lihat README.md § Migrasi.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { type AiMode, availableChapters } from "../../shared/catalog";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE_PATH = path.join(__dirname, "users_db.json");

export type { AiMode };

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
  hint: string;
}

export interface ChapterProgress {
  id: number;
  name: string;
  percent: number;
  tone: "high" | "good" | "warning";
}

export interface StudentHelp {
  id: string;
  name: string;
  chapter: string;
  score: number;
  outOf: number;
}

export interface ClassSummary {
  totalStudents: number;
  averageComprehension: number;
  activeModules: number;
  studentsNeedingIntervention: number;
  modulesNote?: string;
}

const delay = (_ms: number) => Promise.resolve();

// Dipakai hanya untuk memvalidasi query param ?chapter= pada /api/ai-content.
void availableChapters;

const chapterProgressDb: ChapterProgress[] = [
  { id: 1, name: "PKn: Bab 1 - Makna Sila Ke-3", percent: 88, tone: "high" },
  { id: 2, name: "PKn: Bab 2 - Gotong Royong", percent: 58, tone: "warning" },
  { id: 3, name: "PKn: Bab 3 - Norma & Aturan Sekolah", percent: 94, tone: "high" },
  { id: 4, name: "PKn: Bab 4 - Bhinneka Tunggal Ika", percent: 72, tone: "good" },
  { id: 5, name: "B. Jawa: Bab 1 - Unggah-ungguh Basa", percent: 76, tone: "good" },
  { id: 6, name: "B. Jawa: Bab 2 - Tokoh Wayang Punokawan", percent: 85, tone: "good" },
  { id: 7, name: "B. Jawa: Bab 3 - Pandhawa Lima", percent: 90, tone: "high" },
  { id: 8, name: "B. Jawa: Bab 4 - Aksara Jawa", percent: 65, tone: "warning" },
];

const studentsNeedingHelpDb: StudentHelp[] = [
  { id: "s1", name: "Budi Santoso", chapter: "Gotong Royong", score: 2, outOf: 10 },
  { id: "s2", name: "Siti Aminah", chapter: "Gotong Royong", score: 5, outOf: 10 },
];

const aiContentLibrary: Record<string, Record<AiMode, { title: string; body: string[] }>> = {
  "pkn-sila3": {
    cerita: {
      title: "Ringkasan Modul & Pengamalan: Sila Ke-3 Persatuan Indonesia",
      body: [
        "Pengertian & Hakikat Sila Ke-3: Sila ketiga Pancasila berbunyi 'Persatuan Indonesia' dengan lambang Pohon Beringin. Hakikat sila ini adalah tekad bersama bangsa Indonesia yang memiliki ribuan suku, bahasa, dan budaya berbeda untuk bersatu bulat dalam satu kesatuan bangsa yang utuh, tanpa membeda-bedakan asal-usul.",
        "Makna Filosofis Pohon Beringin: Pohon beringin berakar tunggang dalam yang menancap kuat ke bumi melambangkan negara Indonesia sebagai tempat berteduh dan berlindung seluruh rakyat dengan aman. Sulur dan akar gantung yang menjalar ke segala arah mencerminkan kekayaan ragam suku dan budaya Nusantara yang tetap terikat kokoh dalam satu pohon persatuan.",
        "Mengapa Materi Ini Penting Bagi Siswa SD?: Memahami persatuan sejak dini mencegah timbulnya perselisihan, saling ejek, atau permusuhan antarteman. Siswa belajar bahwa perbedaan latar belakang adalah kekayaan bangsa yang harus disyukuri, bukan alasan untuk berpecah belah.",
        "Aksi Nyata & Penerapan di Sekolah: Melaksanakan tugas piket kebersihan kelas secara kompak tanpa pilih-pilih kawan, mengajak teman baru atau yang pendiam bermain bersama saat jam istirahat, serta membiasakan diri menggunakan Bahasa Indonesia yang santun di ruang kelas.",
        "Pengamalan di Rumah & Warga: Menjaga kerukunan antaranggota keluarga di rumah, tidak membuat kegaduhan ketika tetangga sedang beribadah, serta ikut membantu saat ada kegiatan kerja bakti membersihkan lingkungan tempat tinggal.",
        "Nilai Budi Pekerti & Karakter Bangsa: Membiasakan sikap toleran, rendah hati, cinta tanah air, dan bangga memakai produk karya bangsa sendiri seperti batik Indonesia.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Persatuan Indonesia",
      body: [
        "Ayo uji pemahamanmu tentang pengamalan Sila ke-3 dengan menjawab soal kuis yang sudah disiapkan Robot Pintar!",
        "Klik tombol 'Mulai Kuis Tantangan' di menu kiri untuk menguji pemahaman konsepmu!",
      ],
    },
  },
  "pkn-gotongroyong": {
    cerita: {
      title: "Ringkasan Modul & Pengamalan: Gotong Royong sebagai Jati Diri Bangsa",
      body: [
        "Pengertian & Asal-Usul Gotong Royong: Gotong royong berasal dari kata 'gotong' (mengangkat atau memikul bersama) dan 'royong' (bersama-sama). Gotong royong adalah tradisi luhur bangsa Indonesia berupa kegiatan bekerja bersama-sama secara sukarela untuk mencapai tujuan bersama yang bermanfaat bagi banyak orang.",
        "Prinsip Utama & Pembagian Tanggung Jawab: Prinsip dasar gotong royong adalah 'berat sama dipikul, ringan sama dijinjing'. Pekerjaan besar dan berat akan terasa ringan serta cepat selesai bila setiap orang mengambil peran masing-masing dengan ikhlas tanpa pamrih.",
        "Mengapa Gotong Royong Wajib Dipelajari?: Mengikis sifat individualis (mementingkan diri sendiri), menumbuhkan empati sosial, dan mempererat tali persaudaraan sesama kawan sehingga kelas menjadi ruang belajar yang nyaman dan hangat.",
        "Aksi Nyata di Lingkungan Sekolah: Bekerja sama menata perpustakaan kelas, merapikan meja dan kursi setelah jam belajar, serta aktif dalam kelompok diskusi di mana kawan yang sudah paham membantu kawan yang masih kesulitan belajar.",
        "Pengamalan di Rumah & Warga: Membantu meringankan pekerjaan orang tua seperti merapikan tempat tidur sendiri dan mencuci piring, serta ikut serta dalam kegiatan membersihkan selokan lingkungan dari sampah.",
        "Nilai Karakter Pelajar Pancasila: Menanamkan jiwa tolong-menolong, peduli lingkungan, tanggung jawab bersama, dan tidak mengharapkan imbalan materi saat menolong sesama.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Gotong Royong",
      body: [
        "Ayo uji pemahamanmu tentang nilai gotong royong dengan menjawab soal kuis bersama Robot Pintar!",
        "Klik tombol 'Mulai Kuis Tantangan' di menu kiri untuk menambah poin prestasimu!",
      ],
    },
  },
  "pkn-norma": {
    cerita: {
      title: "Ringkasan Modul & Pengamalan: Norma, Aturan & Tertib Hukum",
      body: [
        "Pengertian & Asal-Usul Norma: Kata norma diserap dari bahasa Belanda 'norm' dan bahasa Latin 'norma' yang bermakna garis siku pengukur tegak lurus—dimaknai sebagai kaidah, pedoman tingkah laku, dan tolok ukur yang disepakati bersama agar kehidupan bermasyarakat berjalan tertib, aman, dan berkeadilan.",
        "Empat Macam Norma Utama: Terdiri atas Norma Agama (wahyu Tuhan), Norma Kesusilaan (suara hati nurani), Norma Kesopanan (tata krama adat pergaulan), serta Norma Hukum (aturan tertulis negara yang tegas dan mengikat).",
        "Keseimbangan Hak dan Kewajiban: Kewajiban adalah tugas yang harus kita laksanakan dengan penuh tanggung jawab, sedangkan hak adalah sesuatu yang sah kita terima. Mendahulukan kewajiban sebelum menuntut hak melahirkan keadilan dan kedamaian.",
        "Aksi Nyata di Sekolah: Datang tepat waktu sebelum bel masuk berbunyi, mendengarkan bimbingan guru dengan tertib, menjaga kebersihan kelas, serta membiasakan budaya antre di kantin dan perpustakaan.",
        "Pengamalan di Rumah & Warga: Menghormati nasihat orang tua, menjaga ketenangan saat tetangga beristirahat, dan mematuhi aturan keluarga.",
        "Nilai Karakter Bangsa: Membiasakan sikap jujur, mandiri, disiplin waktu, dan menghormati hak asasi sesama kawan.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Norma & Aturan Sekolah",
      body: [
        "Ayo uji pemahamanmu tentang tata tertib dan aturan sekolah bersama Robot Pintar!",
      ],
    },
  },
  "pkn-bhinneka": {
    cerita: {
      title: "Ringkasan Modul & Pengamalan: Bhinneka Tunggal Ika & Toleransi Beragama",
      body: [
        "Pengertian & Asal-Usul Semboyan: Semboyan Bhinneka Tunggal Ika berasal dari Kitab Sutasoma karangan Mpu Tantular pada era Majapahit, berbunyi 'Bhinneka Tunggal Ika tan hana dharma mangrwa', yang bermakna meskipun berbeda-beda keyakinan dan suku bangsa, pada hakikatnya kita tetap satu jua dalam ikatan keluarga besar Indonesia.",
        "Landasan Konstitusi & Kemerdekaan Beragama: Kemerdekaan memeluk keyakinan dijamin secara kokoh dalam Sila ke-1 Pancasila serta Pasal 29 Ayat (2) UUD 1945: Negara menjamin kemerdekaan tiap-tiap penduduk untuk memeluk agamanya masing-masing dan beribadat menurut agamanya dan kepercayaannya itu.",
        "Prinsip Toleransi Beragama (Tasamuh): Kata toleransi berasal dari bahasa Latin 'tolerare' (bersabar dan menahan diri). Menghargai 6 agama resmi di Indonesia (Islam, Kristen Protestan, Katolik, Hindu, Buddha, Khonghucu) dan aliran kepercayaan dengan hidup rukun secara sosial tanpa mencampuradukkan ajaran ritual ibadah.",
        "Kekayaan Ragam Nusantara: Mengenal ribuan pulau, ratusan bahasa daerah, rumah adat (Joglo, Gadang, Tongkonan), pakaian adat, dan kesenian tradisional sebagai kekayaan luhur milik bersama.",
        "Aksi Nyata di Sekolah: Menjaga ketenangan saat teman berdoa sebelum belajar, tetap kompak bermain dan belajar kelompok bersama tanpa membedakan agama kawan, serta saling mengucapkan selamat hari raya dengan santun.",
        "Pengamalan di Rumah & Nilai Luhur: Menjaga ketenangan saat tempat ibadah tetangga sedang melaksanakan peribadatan, bergotong royong tanpa membedakan latar belakang warga, serta menanamkan budi pekerti tepa selira (tenggang rasa) dan cinta damai.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Bhinneka Tunggal Ika",
      body: [
        "Ayo uji wawasan kebangsaan dan keragaman budayamu bersama Robot Pintar!",
      ],
    },
  },
  "bjawa-unggahungguh": {
    cerita: {
      title: "Ringkasan Modul & Trap-Trapan Unggah-Ungguh Basa Jawa",
      body: [
        "Pangertosan & Hakekat Unggah-Ungguh Basa: Unggah-ungguh basa yaiku tata krama, subasita, lan tatatertib anggone micara (guneman) kanthi mbedakake basa manut sapa sing diajak guneman. Tujuane murih pawongan bisa ngajeni wong liya lan nduweni budi pakarti kang alus.",
        "Trap-Trapan Basa & Perangane: Kapérang dadi Basa Ngoko (digunakake marang kanca sebaya utawa wong tuwa marang bocah enom) lan Basa Krama Alus (digunakake nalika matur marang Bapak/Ibu Guru, wong tuwa, lan tiyang ingkang langkung sepuh). Solah bawa kudu selaras: awak rada mbungkuk nalika matur marang wong tuwa.",
        "Tuladha Tembung Penting: Marang wong tuwa: mangan dadi dhahar, turu dadi sare, lunga dadi tindak. Menawa nyritakake awake dhewe marang wong tuwa: nggunakake nedha lan tilem.",
        "Penerapan marang Bapak & Ibu Guru: Nalika nyuwun pirsa babagan tugas sekolah, matur kanthi santun: 'Nyuwun sewu Bapak/Ibu Guru, kepareng kula badhe nyuwun pirsa babagan tugas punika'.",
        "Penerapan ing Griya & Bebrayan: Salim lan ngambung asta nalika pamit bidhal sekolah, mbantu pakaryane wong tuwa, sarta matur 'nderek langkung' nalika mlaku ing sangarepe tiyang sepuh.",
        "Piweling Luhur Wong Jawa: 'Ajining dhiri dumunung ana ing lathi, ajining raga ana ing busana'—tegese ajining manungsa gumantung saka pocapan lan tindak-tanduke kang becik.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Unggah-Ungguh Basa",
      body: [
        "Ayo gladhen unggah-ungguh basa Jawa kanthi mangsuli pitakon saka Robot Pintar!",
        "Pencet tombol 'Mulai Kuis Tantangan' ing sisih kiwa kanggo nguji kawruhmu!",
      ],
    },
  },
  "bjawa-punokawan": {
    cerita: {
      title: "Ringkasan Modul & Filosofi Watak Luhur Tokoh Punokawan",
      body: [
        "Pangertosan & Asal-Usul Punokawan: Punokawan asale saka tembung 'Pana' (paham utawa weruh kanthi cetha) lan 'Kawan' (kanca/sedulur). Punokawan yaiku papat tokoh pamomong para ksatria Pandhawa kang asale saka rakyat cilik, nanging nduweni kawicaksanan luhur kanggo nuntun ksatria marang kabecikan.",
        "Watak Luhur Kyai Semar: Semar minangka bapa pamomong kang sejatine titising dewa (Batara Ismaya). Watake sabar banget, wicaksana, welas asih marang sapa wae, lan ora tau kumalungkung (sombong). Pasinaon: dadi bocah kudu sabar lan ora gampang nesu.",
        "Watak Nala Gareng & Petruk: Gareng tangane ceko lan sikile jinjit minangka perlambang kudu ngati-ati nalika tumindak lan ora njupuk duweke liyan. Petruk dedege dhuwur, irunge dawa, watake grapyak, loman (seneng tetulung), lan pinter gawe senenge kanca tanpa nglarani ati.",
        "Watak Bagong (Blaka Suta): Bagong awake lemu cendhek, watake jujur apa anane (blaka suta), ora seneng lamis (munafik), lan kendel mbelani bebener senadyan ngadhepi bebaya.",
        "Mengapa Siswa Perlu Mempelajari Ini?: Nuntun siswa supaya ora mung ngoyak kepinteran pikiran, nanging uga nduweni watak andhap asor, jujur, lan seneng mbantu kanca kaya para paraga Punokawan.",
        "Penerapan ing Sekolah & Padintenan: Niru watak jujur Bagong nalika nggarap ulangan, watak sabar Semar nalika ana kanca kang nggodha, lan watak loman Petruk nalika ana kanca kang mbutuhake pitulungan.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Wayang Punokawan",
      body: [
        "Ayo uji kawruhmu ngenani paraga lan watak luhur Punokawan!",
        "Pencet tombol 'Mulai Kuis Tantangan' kanggo nguji pemahaman budi pekertimu!",
      ],
    },
  },
  "bjawa-pandhawa": {
    cerita: {
      title: "Ringkasan Modul & Kisah Kautaman Pandhawa Lima ing Baratayuda",
      body: [
        "Silsilah Pandhawa Lima: Pandhawa Lima yaiku putrane Prabu Pandu Dewanata cacah lima: Puntadewa (Yudhistira), Werkudara (Bima), Janaka (Arjuna), Nakula, lan Sadewa.",
        "Watak Luhur Puntadewa: Pembarepe Pandhawa kang nduweni watak sabar banget, jujur, ora nate goroh (ngapusi), lan tansah ngugemi bebener senadyan ngadhepi pacoban gedhe.",
        "Watak Werkudara & Janaka: Werkudara nduweni watak kendel, kukuh mbelani bebener, lan ora seneng basa-basi. Dene Janaka nduweni watak alus budine, sopan santun, lan sekti mandraguna.",
        "Watak Nakula lan Sadewa: Sedulur kembar kang tansah setya tuhu marang sedulur tuwa lan prigel ing babagan petungan sarta tetanèn.",
        "Piwulang Luhur kanggo Siswa: Dadi bocah kudu ngugemi watak jujur kaya Puntadewa, kendel mbelani bebener kaya Werkudara, lan andhap asor kaya Janaka.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Pandhawa Lima",
      body: [
        "Ayo uji kawruh pewayangan babagan silsilah lan watak Pandhawa Lima bebarengan karo Robot Pintar!",
      ],
    },
  },
  "bjawa-aksara": {
    cerita: {
      title: "Ringkasan Modul & Piwulang Maca Nulis Aksara Jawa Legena & Sandhangan",
      body: [
        "Aksara Jawa Legena: Cacahe ana rong puluh (20) aksara wutuh wiwit saka Ha, Na, Ca, Ra, Ka nganti Nga, kang nduweni filosofi utusaning urip kang padha dene setya lan sekti.",
        "Sandhangan Swara: Sandhangan kang ngowahi swara dhasar 'a' dadi: Wulu (swara i), Suku (swara u), Pepet (swara e), Taling (swara é), lan Taling Tarung (swara o).",
        "Sandhangan Panyigeging Wanda: Wignyan (sigeg h), Layar (sigeg r), Cecak (sigeg ng), lan Pangkon (kanggo mateni aksara ing pungkasan ukara).",
        "Piweling Luhur: Sinau maca lan nulis aksara Jawa mujudake rasa tresna lan mongkog marang warisan kabudayan adiluhung tanah Jawa.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Aksara Jawa",
      body: [
        "Ayo gladhen nulis lan maca aksara Jawa kanthi mangsuli pitakon Robot Pintar!",
      ],
    },
  },
};

const mockQuestions: Record<number, Question[]> = {
  1: [
    {
      id: "q1_1",
      question: "Apakah lambang dari Sila Ke-3 Pancasila 'Persatuan Indonesia'?",
      options: ["Bintang Tunggal", "Rantai Emas", "Pohon Beringin", "Padi dan Kapas"],
      correctOption: 2,
      hint: "Pohon yang besar dan rindang, melambangkan naungan persatuan bangsa!",
    },
    {
      id: "q1_2",
      question:
        "Di jam istirahat, kamu melihat teman baru yang duduk sendirian. Sikap yang mencerminkan kerukunan adalah...",
      options: [
        "Membiarkannya saja",
        "Mengajaknya bermain bersama",
        "Menertawakan dari jauh",
        "Menyuruhnya pulang",
      ],
      correctOption: 1,
      hint: "Persatuan dimulai dari sikap ramah dan merangkul semua teman tanpa membeda-bedakan.",
    },
    {
      id: "q1_3",
      question:
        "Sapa jenenge tokoh Punokawan kang dadi bapake lan nduweni watak sabar sarta wicaksana?",
      options: ["Petruk", "Gareng", "Semar", "Bagong"],
      correctOption: 2,
      hint: "Tokoh sesepuh Punokawan kang awake lemu lan tansah paring pitutur luhur.",
    },
    {
      id: "q1_4",
      question:
        "Pekerjaan piket membersihkan ruang kelas terasa lebih cepat dan ringan karena dikerjakan secara...",
      options: [
        "Sendiri-sendiri",
        "Gotong royong bersama",
        "Terpaksa dan mengeluh",
        "Menunggu disuruh guru",
      ],
      correctOption: 1,
      hint: "Semboyan 'berat sama dipikul, ringan sama dijinjing' adalah inti dari semangat gotong royong.",
    },
    {
      id: "q1_5",
      question:
        "Basa Jawa kang lumrah digunakake nalika guneman karo kanca dolanan saumuran yaiku...",
      options: ["Basa Ngoko", "Basa Krama Inggil", "Basa Sanskerta", "Basa Walikan"],
      correctOption: 0,
      hint: "Basa ngoko lumrah digunakake kanggo kanca sebaya utawa kanca dolanan.",
    },
  ],
  2: [
    {
      id: "q2_1",
      question:
        "Mengapa akar gantung dan sulur pohon beringin menjadi lambang persatuan yang sangat bermakna?",
      options: [
        "Karena daunnya berwarna hijau",
        "Karena melambangkan suku bangsa yang beragam tetapi tetap bersatu kuat",
        "Karena bisa digunakan untuk ayunan",
        "Karena pohonnya paling mahal",
      ],
      correctOption: 1,
      hint: "Akar pohon beringin menjalar ke segala arah mencerminkan beragamnya suku dan budaya bangsa kita.",
    },
    {
      id: "q2_2",
      question:
        "Menawa matur marang Bapak utawa Ibu Guru ing sekolahan, unggah-ungguh basa kang bener yaiku nganggo...",
      options: ["Basa Ngoko Lugu", "Basa Krama Alus", "Basa Indonesia Gaul", "Basa Walikan"],
      correctOption: 1,
      hint: "Marang wong sing luwih sepuh lan diurmati, kudu nggunakake basa sing sopan lan alus.",
    },
    {
      id: "q2_3",
      question: "Manakah contoh gotong royong yang paling tepat dilakukan siswa di dalam kelas?",
      options: [
        "Bekerja sama saat ulangan harian",
        "Merapikan meja dan piket kebersihan kelas bersama-sama",
        "Menyuruh teman piket sendirian",
        "Menonton kawan yang sedang menyapu lantai",
      ],
      correctOption: 1,
      hint: "Gotong royong adalah kerja bersama secara sukarela untuk kebaikan bersama.",
    },
    {
      id: "q2_4",
      question: "Tembung 'mangan' menawa diowahi dadi Basa Krama Alus kanggo wong tuwa yaiku...",
      options: ["Nedha", "Dhahar", "Nguntal", "Nyicipi"],
      correctOption: 1,
      hint: "'Bapak nembe dhahar', dene kanggo awake dhewe nggunakake tembung 'nedha'.",
    },
    {
      id: "q2_5",
      question:
        "Tokoh Punokawan kang dedege dhuwur, irunge dawa, lan pinter gawe guyu tanpa nglarani atine wong liya yaiku...",
      options: ["Semar", "Gareng", "Petruk", "Bagong"],
      correctOption: 2,
      hint: "Petruk utawa Kanthong Bolong nduweni watak grapyak, sumeh, pinter gojek, lan loman.",
    },
  ],
  3: [
    {
      id: "q3_1",
      question:
        "Nalika arep budhal sekolah, Doni pamitan marang ibune. Ukara krama alus kang trep yaiku...",
      options: [
        "'Mak, aku arep mangkat saiki ya!'",
        "'Ibu, kula nyuwun pamit badhe bidhal sekolah'",
        "'Bu, mangkat dhisik ya sesuk ketemu maneh'",
        "'Kula arep lunga sekolah dhisik'",
      ],
      correctOption: 1,
      hint: "Gatekna tembung 'nyuwun pamit' lan 'bidhal' kang kalebu tembung krama alus.",
    },
    {
      id: "q3_2",
      question:
        "Bagaimana cara kita membela persatuan bangsa jika ada teman yang mengejek perbedaan suku atau bahasa daerah?",
      options: [
        "Ikut mengejek agar ramai",
        "Menegur dengan sopan dan mengingatkan bahwa kita semua satu bangsa Indonesia",
        "Memusuhi kedua belah pihak",
        "Merekam lalu menyebarkannya",
      ],
      correctOption: 1,
      hint: "Ingatkan semboyan Bhinneka Tunggal Ika: berbeda-beda tetapi tetap satu jua.",
    },
    {
      id: "q3_3",
      question:
        "Watak luhur saka tokoh Bagong kang patut dituladha ing pasrawungan saben dina yaiku...",
      options: [
        "Seneng nesu menawa kalah dolanan",
        "Blaka suta (jujur apa anane) lan kendel mbelani bebener",
        "Seneng pamer bandha donya",
        "Gampang nglokro lan mutung",
      ],
      correctOption: 1,
      hint: "Bagong iku senajan ceplas-ceplos nanging atine resik, jujur, lan ora seneng dora (ngapusi).",
    },
    {
      id: "q3_4",
      question:
        "Nalika mlaku ing sangarepe wong tuwa utawa guru kang lagi lenggah, tata krama Jawa kang trep yaiku...",
      options: [
        "Mlayu banter kanthi swara seru",
        "Mbungkukake awak kanthi matur 'Nyuwun sewu, nderek langkung'",
        "Mlaku jejeg karo dolanan HP",
        "Mlaku mundur ora noleh",
      ],
      correctOption: 1,
      hint: "Sikap mbungkukake awak lan matur 'nderek langkung' minangka tandha pakurmatan marang tiyang sepuh.",
    },
    {
      id: "q3_5",
      question:
        "Di sebuah desa ada warga yang sedang tertimpa musibah rumahnya roboh. Tindakan yang mencerminkan pengamalan Sila Ke-3 dan gotong royong adalah...",
      options: [
        "Hanya menonton dan mengambil foto",
        "Bersama-sama warga lain menyumbang tenaga dan bahan untuk membantu membangun kembali",
        "Menyalahkan cuaca buruk",
        "Meminta warga lain untuk pindah desa",
      ],
      correctOption: 1,
      hint: "Persatuan Indonesia diwujudkan melalui empati dan aksi nyata saling tolong-menolong tanpa membedakan.",
    },
  ],
};

export async function getChapterProgress(): Promise<ChapterProgress[]> {
  await delay(500);
  return chapterProgressDb;
}

export async function getStudentsNeedingHelp(): Promise<StudentHelp[]> {
  await delay(200);
  const remedialStudents = usersDb.filter(
    (u) =>
      u.role === "pelajar" &&
      u.weakness &&
      u.weakness.status === "remedial" &&
      (u.weakness.score / u.weakness.outOf) * 100 < 60
  );
  if (remedialStudents.length > 0) {
    return remedialStudents.map((u) => {
      const chName = u.weakness?.chapterName || "Materi Umum";
      const cleanCh = chName.includes("(")
        ? chName.split("(")[1]?.replace(")", "").trim() || chName
        : chName;
      return {
        id: u.id,
        name: u.name,
        chapter: cleanCh,
        score: u.weakness?.score ?? 5,
        outOf: u.weakness?.outOf ?? 10,
      };
    });
  }
  return studentsNeedingHelpDb;
}

// Sengaja diberi delay lebih lama untuk mendemonstrasikan Loading Skeleton +
// TanStack Query pada ClassSummaryCards (dulu Streaming SSR + <Suspense> di
// Next.js; kini Loading State standar useQuery.isLoading di Vite SPA).
export async function getClassSummary(): Promise<ClassSummary> {
  await delay(400);
  const studentUsers = usersDb.filter((u) => u.role === "pelajar");
  const totalPercent = chapterProgressDb.reduce((acc, c) => acc + c.percent, 0);
  const avgComprehension =
    chapterProgressDb.length > 0
      ? Math.round((totalPercent / chapterProgressDb.length) * 10) / 10
      : 0;

  const modules =
    curriculumModulesDb && curriculumModulesDb.length > 0
      ? curriculumModulesDb
      : INITIAL_MODULES_DB;
  const activeCount = modules.length;
  const pknCount = modules.filter((m) => m.subject === "pkn").length;
  const bjawaCount = modules.filter((m) => m.subject === "bjawa").length;

  return {
    totalStudents: studentUsers.length,
    averageComprehension: avgComprehension,
    activeModules: activeCount,
    studentsNeedingIntervention: studentsNeedingHelpDb.length,
    modulesNote: `📚 ${pknCount} Bab PKn & ${bjawaCount} Bab Bahasa Jawa`,
  };
}

// --- State Modul Aktif Tervalidasi Guru & Database Kurikulum Persisten -----
export interface ActiveCurriculumState {
  id: string;
  title: string;
  chapterCode: string;
  subject: string;
  ragSummary?: string[];
  quizQuestions?: Record<number, Question[]>;
}

export interface CurriculumModuleRecord {
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
  quizQuestions?: Record<number, Question[]>;
}

const INITIAL_MODULES_DB: CurriculumModuleRecord[] = [
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
    quizQuestions: {
      1: [
        {
          id: "q1_nas_1",
          question: "Apakah arti dari rasa cinta tanah air (nasionalisme) bagi anak sekolah dasar?",
          options: [
            "Rasa bangga, sayang, dan setia kepada bangsa dan negara Indonesia",
            "Hanya menyukai barang dan budaya dari luar negeri",
            "Menolak berteman dengan kawan yang berbeda daerah",
            "Sikap malas dan tidak mau ikut upacara bendera",
          ],
          correctOption: 0,
          hint: "Nasionalisme adalah wujud rasa cinta dan kebanggaan kita sebagai anak Indonesia.",
        },
        {
          id: "q1_nas_2",
          question: "Lagu kebangsaan negara Indonesia yang selalu kita nyanyikan dengan sikap tegak saat upacara sekolah adalah...",
          options: [
            "Indonesia Raya ciptaan W.R. Supratman",
            "Balonku Ada Lima",
            "Bintang Kejora",
            "Pelangi-Pelangi",
          ],
          correctOption: 0,
          hint: "Lagu kebangsaan resmi Indonesia adalah 'Indonesia Raya' yang diciptakan oleh W.R. Supratman.",
        },
      ],
      2: [
        {
          id: "q2_nas_1",
          question: "Saat bendera Merah Putih dinaikkan pada upacara bendera hari Senin di sekolah, sikap yang benar adalah...",
          options: [
            "Berdiri tegak dengan sikap khidmat dan memberikan hormat kepada bendera",
            "Duduk santai di bawah pohon sambil makan bekal jajan",
            "Mengobrol dan bercanda bersama teman di barisan",
            "Bermain kejar-kejaran di lapangan upacara",
          ],
          correctOption: 0,
          hint: "Upacara bendera mengajarkan rasa hormat dan terima kasih atas perjuangan para pahlawan.",
        },
        {
          id: "q2_nas_2",
          question: "Siti gemar mengenakan sepatu dan tas buatan pengrajin lokal Indonesia serta bangga memakai pakaian batik. Sikap Siti mencerminkan...",
          options: [
            "Rasa cinta dan bangga menggunakan produk dalam negeri",
            "Sikap pelit dan tidak mampu membeli barang luar negeri",
            "Keterpaksaan karena diperintah teman",
            "Kurangnya pengetahuan tentang barang luar negeri",
          ],
          correctOption: 0,
          hint: "Menggunakan produk buatan bangsa sendiri adalah salah satu wujud nyata cinta tanah air.",
        },
      ],
      3: [
        {
          id: "q3_nas_1",
          question: "Di kelasmu ada teman baru yang berasal dari daerah lain dan memiliki logat bicara berbeda. Sikap menjaga persatuan bangsa yang tepat adalah...",
          options: [
            "Menyambutnya dengan ramah, menghargai perbedaannya, dan mengajaknya bermain bersama",
            "Menertawakan logat bicaranya saat dia bertanya kepada guru",
            "Menolak duduk sebangku dengannya karena berbeda asal daerah",
            "Meminta guru agar memindahkannya ke kelas lain",
          ],
          correctOption: 0,
          hint: "Semboyan Bhinneka Tunggal Ika mengajarkan kita untuk rukun bersahabat dengan semua anak bangsa.",
        },
        {
          id: "q3_nas_2",
          question: "Bendera pusaka negara kita berwarna Merah dan Putih. Apakah arti luhur dari kedua warna tersebut?",
          options: [
            "Merah artinya berani membela kebenaran, Putih artinya suci dan bersih hatinya",
            "Merah artinya cepat marah, Putih artinya mudah menyerah",
            "Merah artinya warna api, Putih artinya warna kertas biasa",
            "Merah artinya suka bertengkar, Putih artinya penakut",
          ],
          correctOption: 0,
          hint: "Merah melambangkan keberanian bangsa, sedangkan putih melambangkan niat suci hati nurani.",
        },
      ],
    },
  },
];

let curriculumModulesDb: CurriculumModuleRecord[] = [...INITIAL_MODULES_DB];

let activeCurriculumState: ActiveCurriculumState | null = {
  id: "mod-pkn-sila3",
  title: "Makna Lambang Sila Ke-3: Persatuan Indonesia di Sekolah & Rumah",
  chapterCode: "Bab 1",
  subject: "pkn",
  ragSummary: INITIAL_MODULES_DB[0]?.ragSummary,
};

export async function getCurriculumModules(): Promise<CurriculumModuleRecord[]> {
  await delay(100);
  if (!curriculumModulesDb || curriculumModulesDb.length === 0) {
    curriculumModulesDb = [...INITIAL_MODULES_DB];
  }
  return [...curriculumModulesDb];
}

export async function saveCurriculumModule(
  mod: Partial<CurriculumModuleRecord> & { title: string }
): Promise<CurriculumModuleRecord> {
  await delay(100);
  const id = mod.id || `mod-${mod.subject || "pkn"}-${Date.now()}`;
  const existingIdx = curriculumModulesDb.findIndex((m) => m.id === id);

  const fullRecord: CurriculumModuleRecord = {
    id,
    subject: mod.subject || "pkn",
    subjectLabel:
      mod.subjectLabel ||
      (mod.subject === "bjawa" ? "Basa Jawa (Muatan Lokal)" : "Pendidikan Pancasila & PKn"),
    grade: mod.grade || "Kelas 4 SD (Fase B)",
    title: mod.title,
    chapterCode: mod.chapterCode || "Bab Pelajaran",
    source: mod.source || "API SIBI Kemdikbudristek RI (Buku Teks Kurikulum Merdeka)",
    sourceType: mod.sourceType || "kemdikbud",
    pageCount: mod.pageCount || 24,
    learningGoal:
      mod.learningGoal ||
      "Peserta didik memahami inti materi dan mempraktikkannya dalam kehidupan sehari-hari.",
    isValidated: mod.isValidated ?? false,
    isActiveToday: mod.isActiveToday ?? false,
    validatedAt: mod.validatedAt,
    ragSummary: mod.ragSummary || [],
    generatedQuizPreview: mod.generatedQuizPreview || [],
    quizQuestions: mod.quizQuestions,
  };

  if (existingIdx >= 0) {
    const existing = curriculumModulesDb[existingIdx];
    if (existing) {
      curriculumModulesDb[existingIdx] = {
        ...existing,
        ...fullRecord,
      };
      return curriculumModulesDb[existingIdx]!;
    }
    return fullRecord;
  } else {
    curriculumModulesDb.unshift(fullRecord);
    return fullRecord;
  }
}

export async function deleteCurriculumModule(id: string): Promise<boolean> {
  await delay(100);
  if (!curriculumModulesDb || curriculumModulesDb.length === 0) {
    curriculumModulesDb = [...INITIAL_MODULES_DB];
  }

  const cleanTargetId = id.replace("mod-", "");
  const idx = curriculumModulesDb.findIndex(
    (m) => m.id === id || m.id.replace("mod-", "") === cleanTargetId
  );

  if (idx !== -1) {
    const target = curriculumModulesDb[idx];
    const wasActive = Boolean(target?.isActiveToday);
    curriculumModulesDb.splice(idx, 1);

    // Jika yang dihapus sedang aktif, aktifkan modul pertama yang tersisa
    if (wasActive && curriculumModulesDb.length > 0) {
      const firstRemaining = curriculumModulesDb[0];
      if (firstRemaining) {
        firstRemaining.isActiveToday = true;
        firstRemaining.isValidated = true;
        setActiveCurriculumState({
          id: firstRemaining.id,
          title: firstRemaining.title,
          chapterCode: firstRemaining.chapterCode,
          subject: firstRemaining.subject,
          ragSummary: firstRemaining.ragSummary,
          quizQuestions: firstRemaining.quizQuestions,
        });
      }
    } else if (curriculumModulesDb.length === 0) {
      activeCurriculumState = null;
    }
  }

  return true;
}

export function setActiveCurriculumState(mod: ActiveCurriculumState) {
  const sanitizedSummary = mod.ragSummary?.map((item) =>
    item
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, "")
      .replace(/Hakikat Materi:\s*Memahami prinsip pokok[^\.]*\.?\s*/gi, "")
      .replace(/Keterkaitan Nyata:\s*/gi, "Penerapan di masyarakat: ")
      .replace(/Pengetahuan Kritis:\s*Melatih siswa agar[^\.]*\.?\s*/gi, "")
      .replace(
        /Mempelajari materi ini melatih daya pikir kritis[^\.]*\.?\s*/gi,
        "Mempelajari materi ini membuat kita saling peduli dan rukun. "
      )
      .trim()
  );

  activeCurriculumState = {
    ...mod,
    ragSummary: sanitizedSummary,
  };

  // Sinkronkan status isActiveToday di database list modul
  curriculumModulesDb = curriculumModulesDb.map((item) => {
    if (
      item.id === mod.id ||
      item.id.replace("mod-", "") === mod.id.replace("mod-", "")
    ) {
      return {
        ...item,
        isValidated: true,
        isActiveToday: true,
        validatedAt: "Baru saja divalidasi oleh Guru",
        ragSummary: sanitizedSummary || item.ragSummary,
        quizQuestions: mod.quizQuestions || item.quizQuestions,
      };
    }
    return {
      ...item,
      isActiveToday: false,
    };
  });

  if (sanitizedSummary && sanitizedSummary.length > 0) {
    const contentObj = {
      cerita: {
        title: `Ringkasan Modul & Pengamalan: ${mod.chapterCode} - ${mod.title}`,
        body: sanitizedSummary,
      },
      kuis_tantangan: {
        title: `Kuis Tantangan Seru: ${mod.title}`,
        body: [
          `Ayo uji pemahamanmu tentang materi ${mod.title} bersama Robot Pintar!`,
          "Klik tombol 'Mainkan Kuis Seru' di menu kiri untuk menambah poin prestasimu!",
        ],
      },
    };
    aiContentLibrary[mod.id] = contentObj;
    // Daftarkan juga alias id tanpa prefix "mod-" atau dengan prefix "mod-"
    const cleanId = mod.id.replace("mod-", "");
    aiContentLibrary[cleanId] = contentObj;
    aiContentLibrary[`mod-${cleanId}`] = contentObj;
  }
}

export function getActiveCurriculumState() {
  return activeCurriculumState;
}

export async function getAiContent(chapterId: string, mode: AiMode) {
  await delay(200);

  const cleanId = chapterId.replace("mod-", "");
  const modPrefixedId = chapterId.startsWith("mod-") ? chapterId : `mod-${chapterId}`;

  // 1. Jika pengguna meminta modul aktif tervalidasi atau id-nya cocok dengan modul aktif saat ini
  if (
    activeCurriculumState &&
    (chapterId === "active" ||
      chapterId === activeCurriculumState.id ||
      cleanId === activeCurriculumState.id.replace("mod-", ""))
  ) {
    if (mode === "kuis_tantangan") {
      return {
        title: `Kuis Tantangan Seru: ${activeCurriculumState.title}`,
        body: [
          `Ayo uji pemahamanmu tentang materi ${activeCurriculumState.title} bersama Robot Pintar!`,
          "Klik tombol 'Mainkan Kuis Seru' di menu kiri untuk menambah poin prestasimu!",
        ],
      };
    }

    return {
      title: `Ringkasan Modul & Pengamalan: ${activeCurriculumState.chapterCode} - ${activeCurriculumState.title}`,
      body:
        activeCurriculumState.ragSummary && activeCurriculumState.ragSummary.length > 0
          ? activeCurriculumState.ragSummary
          : [
              `Pengertian Pokok: Pembelajaran ${activeCurriculumState.chapterCode} mengenai "${activeCurriculumState.title}" disarikan ke dalam konsep budi pekerti ramah anak SD.`,
              "Aksi Nyata di Sekolah: Mengajak siswa bekerja sama dan mematuhi aturan tata tertib kelas dengan disiplin.",
              "Pengamalan di Rumah: Membiasakan sikap santun, menghormati orang tua dan anggota keluarga.",
            ],
    };
  }

  // 2. Cek pustaka konten statis
  const content =
    aiContentLibrary[chapterId]?.[mode] ||
    aiContentLibrary[cleanId]?.[mode] ||
    aiContentLibrary[modPrefixedId]?.[mode];

  if (content) {
    return content;
  }

  // 3. Cek database modul tersimpan
  const savedMod = curriculumModulesDb.find(
    (m) => m.id === chapterId || m.id === cleanId || m.id === modPrefixedId
  );
  if (savedMod) {
    if (mode === "kuis_tantangan") {
      return {
        title: `Kuis Tantangan Seru: ${savedMod.title}`,
        body: [
          `Ayo uji pemahamanmu tentang materi ${savedMod.title} bersama Robot Pintar!`,
          "Klik tombol 'Mainkan Kuis Seru' di menu kiri untuk menambah poin prestasimu!",
        ],
      };
    }
    if (savedMod.ragSummary && savedMod.ragSummary.length > 0) {
      return {
        title: `Ringkasan Modul & Pengamalan: ${savedMod.chapterCode} - ${savedMod.title}`,
        body: savedMod.ragSummary,
      };
    }
  }

  return {
    title: `Ringkasan Modul: ${chapterId}`,
    body: [
      `Pengertian Pokok: Materi siap dipelajari bersama Robot Pintar.`,
      "Aksi Nyata di Sekolah: Belajar tekun bersama kawan-kawan.",
      "Pengamalan di Rumah: Berbakti kepada orang tua.",
    ],
  };
}

export async function getQuestionsByLevel(level: number): Promise<Question[]> {
  await delay(200);
  // Jika ada soal yang di-generate dari modul aktif guru, utamakan soal tersebut
  if (
    activeCurriculumState?.quizQuestions?.[level] &&
    activeCurriculumState.quizQuestions[level].length > 0
  ) {
    return activeCurriculumState.quizQuestions[level];
  }
  const data = mockQuestions[level];
  if (!data) {
    throw new Error(`Soal untuk level ${level} tidak ditemukan.`);
  }
  return data;
}

// --- "Database" materi in-memory --------------------------------------------
export interface MaterialRecord {
  id: string;
  title: string;
  fileName: string;
  variant: "private" | "public";
  chapter?: string;
  indexedAt: string;
}

const materialsDb: MaterialRecord[] = [];

export async function getMaterials(): Promise<MaterialRecord[]> {
  await delay(600);
  return [...materialsDb].reverse();
}

export async function saveMaterial(payload: {
  title: string;
  fileName: string;
  variant: "private" | "public";
  chapter?: string;
}) {
  await delay(900);
  const record: MaterialRecord = {
    id: `doc_${Date.now()}`,
    title: payload.title,
    fileName: payload.fileName,
    variant: payload.variant,
    chapter: payload.chapter,
    indexedAt: new Date().toISOString(),
  };
  materialsDb.push(record);
  return record;
}

export async function buildClassReportCsv() {
  await delay(700);
  const summary = await getClassSummary();
  const chapters = await getChapterProgress();
  const students = await getStudentsNeedingHelp();

  const rows: (string | number)[][] = [];
  rows.push(["LAPORAN REKAPITULASI HASIL EVALUASI BELAJAR SISWA"]);
  rows.push(["Satuan Pendidikan", "SD Negeri 1 Madiun"]);
  rows.push(["Kelas / Fase", "Kelas 4A / Fase B (Tahun Ajaran 2025/2026)"]);
  rows.push(["Mata Pelajaran", "Pendidikan Pancasila (PKn) & Bahasa Jawa (Muatan Lokal)"]);
  rows.push(["Guru Kelas", "Bpk. Darmawan, S.Pd.SD (NIP. 198506122010011012)"]);
  rows.push(["Integrasi Materi", "API SIBI Kemdikbudristek & Repositori Mulok Disdikbud"]);
  rows.push(["Waktu Ekspor", new Date().toLocaleString("id-ID")]);
  rows.push([]);
  rows.push(["I. RINGKASAN EKSEKUTIF KELAS"]);
  rows.push(["Total Siswa Terdaftar", `${summary.totalStudents} Siswa SD`]);
  rows.push(["Rata-Rata Pemahaman Kelas (%)", `${summary.averageComprehension}%`]);
  rows.push([
    "Modul Aktif Terintegrasi API",
    `${summary.activeModules} Modul Resmi (Kurikulum Merdeka & Mulok Jawa)`,
  ]);
  rows.push(["Siswa Perlu Bimbingan Remedial", `${summary.studentsNeedingIntervention} Siswa`]);
  rows.push([]);
  rows.push(["II. CAPAIAN PEMAHAMAN PER BAB (PKn & BAHASA JAWA)"]);
  rows.push(["Mata Pelajaran & Bab", "Persentase (%)", "Kategori Ketuntasan"]);
  for (const c of chapters) {
    const status =
      c.percent >= 75
        ? "Tuntas (Pemahaman Sangat Baik)"
        : c.percent >= 70
          ? "Tuntas (Pemahaman Baik)"
          : "Perlu Bimbingan / Remedial";
    rows.push([c.name, `${c.percent}%`, status]);
  }
  rows.push([]);
  rows.push(["III. DAFTAR SISWA DALAM PROGRAM BIMBINGAN REMEDIAL"]);
  rows.push(["Nama Siswa", "Materi Terkendala", "Hasil Kuis", "Rencana Tindak Lanjut Guru"]);
  for (const s of students) {
    rows.push([
      s.name,
      s.chapter,
      `${s.score}/${s.outOf}`,
      "Diberikan ringkasan materi audio robot & latihan soal pemahaman dasar Level 1",
    ]);
  }
  rows.push([]);
  rows.push(["IV. REKAPITULASI PRESTASI & KEAKTIFAN BELAJAR SISWA KELAS 4A"]);
  rows.push(["Peringkat", "NISN / Nama Siswa", "Skor Poin", "Predikat"]);
  rows.push(["1", "Raditya Pratama (NISN: 0148291023)", "430 Poin", "Sangat Memuaskan (A)"]);
  rows.push(["2", "Budi Santoso (NISN: 0148291045)", "360 Poin", "Baik (B+)"]);
  rows.push(["3", "Siti Aminah (NISN: 0148291078)", "310 Poin", "Baik (B)"]);
  rows.push(["4", "Ahmad Fauzi (NISN: 0148291089)", "270 Poin", "Cukup Baik (B-)"]);

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  return { fileName: `Laporan_Evaluasi_Siswa_SDN1Madiun_${Date.now()}.csv`, content: csv };
}

// --- Entitas Pengguna & Profil (FR-01, FR-22) -------------------------------
export interface StudentWeakness {
  chapterId: string;
  chapterName: string;
  subject: string;
  score: number;
  outOf: number;
  status: "remedial" | "tuntas";
  message: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "pelajar" | "pengajar";
  nimNip: string;
  institution: string;
  points?: number;
  weakness?: StudentWeakness;
}

const INITIAL_USERS_DB: UserAccount[] = [
  {
    id: "usr_1",
    name: "Ghandur Fauzan Ngauf Hisam",
    email: "ghandur@gmail.com",
    passwordHash: bcrypt.hashSync("secret123", 10),
    role: "pelajar",
    nimNip: "V3925024",
    institution: "D3 Teknik Informatika Madiun, Sekolah Vokasi UNS",
    points: 420,
    weakness: {
      chapterId: "pkn-sila3",
      chapterName: "Pelajaran PKn (Makna Sila Ke-3)",
      subject: "pkn",
      score: 10,
      outOf: 10,
      status: "tuntas",
      message:
        "Luar biasa! Seluruh evaluasi belajarmu telah Tuntas Melampaui KKTP (Rata-rata 95%). Guru merekomendasikanmu melanjutkan materi pengayaan Makna Sila Ke-3 untuk mempertahankan prestasimu!",
    },
  },
  {
    id: "usr_2",
    name: "Ridho Asykuri",
    email: "ridho@gmail.com",
    passwordHash: bcrypt.hashSync("secret123", 10),
    role: "pelajar",
    nimNip: "V3925015",
    institution: "D3 Teknik Informatika Madiun, Sekolah Vokasi UNS",
    points: 380,
    weakness: {
      chapterId: "pkn-bhinneka",
      chapterName: "Pelajaran PKn (Bhinneka Tunggal Ika)",
      subject: "pkn",
      score: 5,
      outOf: 10,
      status: "remedial",
      message:
        "Nilai evaluasi di Pelajaran PKn (Bhinneka Tunggal Ika) masih di bawah Kriteria Ketuntasan (KKTP). Silakan pelajari kembali keragaman suku dan budaya Nusantara yang telah disiapkan Guru.",
    },
  },
  {
    id: "usr_4",
    name: "Budi Santoso",
    email: "budi@gmail.com",
    passwordHash: bcrypt.hashSync("secret123", 10),
    role: "pelajar",
    nimNip: "V3925001",
    institution: "SD Negeri 1 Madiun",
    points: 360,
    weakness: {
      chapterId: "pkn-gotongroyong",
      chapterName: "Pelajaran PKn (Gotong Royong)",
      subject: "pkn",
      score: 2,
      outOf: 10,
      status: "remedial",
      message:
        "Nilai evaluasi di Pelajaran PKn (Gotong Royong) masih di bawah Kriteria Ketuntasan (KKTP). Silakan pelajari kembali ringkasan materi dan intisari pengamalan yang telah disiapkan Guru.",
    },
  },
  {
    id: "usr_5",
    name: "Siti Aminah",
    email: "siti@gmail.com",
    passwordHash: bcrypt.hashSync("secret123", 10),
    role: "pelajar",
    nimNip: "V3925002",
    institution: "SD Negeri 1 Madiun",
    points: 310,
    weakness: {
      chapterId: "bjawa-aksara",
      chapterName: "Pelajaran Bahasa Jawa (Aksara Jawa)",
      subject: "bjawa",
      score: 5,
      outOf: 10,
      status: "remedial",
      message:
        "Nilai evaluasi di Pelajaran Bahasa Jawa (Aksara Jawa & Sandhangan) masih di bawah Kriteria Ketuntasan (KKTP). Silakan pelajari kembali aturan sandhangan swara dan bentuk 20 aksara legena.",
    },
  },
  {
    id: "usr_6",
    name: "Ahmad Fauzi",
    email: "ahmad@gmail.com",
    passwordHash: bcrypt.hashSync("secret123", 10),
    role: "pelajar",
    nimNip: "V3925003",
    institution: "SD Negeri 1 Madiun",
    points: 270,
    weakness: {
      chapterId: "bjawa-unggahungguh",
      chapterName: "Pelajaran Bahasa Jawa (Unggah-Ungguh Basa)",
      subject: "bjawa",
      score: 4,
      outOf: 10,
      status: "remedial",
      message:
        "Nilai evaluasi di Pelajaran Bahasa Jawa (Unggah-Ungguh Basa) masih di bawah Kriteria Ketuntasan (KKTP). Silakan pelajari kembali perbedaan ragam Basa Ngoko dan Basa Krama Alus bersama Robot Pintar.",
    },
  },
  {
    id: "usr_3",
    name: "Darmawan Lahru Riatma, S.Kom., M.MT",
    email: "darmawan@gmail.com",
    passwordHash: bcrypt.hashSync("dosen123", 10),
    role: "pengajar",
    nimNip: "1991091420200801",
    institution: "D3 Teknik Informatika Madiun, Sekolah Vokasi UNS",
  },
  {
    id: "usr_teacher_1",
    name: "Ibu Guru Retno, S.Pd.",
    email: "guru@gmail.com",
    passwordHash: bcrypt.hashSync("guru123", 10),
    role: "pengajar",
    nimNip: "198705122011012004",
    institution: "SD Negeri 1 Madiun",
  },
  {
    id: "usr_teacher_2",
    name: "Bpk. Joko Susilo, S.Pd.",
    email: "pak.guru@gmail.com",
    passwordHash: bcrypt.hashSync("guru123", 10),
    role: "pengajar",
    nimNip: "198302152009021003",
    institution: "SD Negeri 1 Madiun",
  },
];

function loadUsersDb(): UserAccount[] {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const content = fs.readFileSync(USERS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let changed = false;
        const enriched = parsed.map((u: UserAccount) => {
          if (!u.weakness && u.role === "pelajar") {
            changed = true;
            const initMatch = INITIAL_USERS_DB.find(
              (init) => init.id === u.id || init.email.toLowerCase() === u.email.toLowerCase()
            );
            if (initMatch?.weakness) {
              return { ...u, weakness: initMatch.weakness };
            }
            return {
              ...u,
              weakness: {
                chapterId: "pkn-sila3",
                chapterName: "Pelajaran PKn (Makna Sila Ke-3)",
                subject: "pkn",
                score: 8,
                outOf: 10,
                status: "tuntas" as const,
                message:
                  "Selamat belajar! Belum ada catatan remedial pada akunmu. Mulai eksplorasi belajarmu dari modul utama Makna Lambang Sila Ke-3 bersama Robot Pintar!",
              },
            };
          }
          return u;
        });
        if (changed) {
          try {
            fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(enriched, null, 2), "utf-8");
          } catch {}
        }
        return enriched;
      }
    }
  } catch (err) {
    console.error("Gagal membaca users_db.json, menggunakan data awal:", err);
  }
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(INITIAL_USERS_DB, null, 2), "utf-8");
  } catch {}
  return [...INITIAL_USERS_DB];
}

function persistUsersDb(): void {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(usersDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan ke users_db.json:", err);
  }
}

let usersDb: UserAccount[] = loadUsersDb();

let lastPointsResetTime: number = 0;

export function getLastPointsResetTime(): number {
  return lastPointsResetTime;
}

export async function resetStudentsPoints(): Promise<{ success: boolean; count: number; resetAt: number }> {
  await delay(150);
  let count = 0;
  usersDb.forEach((u) => {
    if (u.role === "pelajar") {
      u.points = 0;
      count++;
    }
  });
  lastPointsResetTime = Date.now();
  persistUsersDb();
  return { success: true, count, resetAt: lastPointsResetTime };
}

export async function addStudentPoints(
  identifier?: string,
  amount: number = 10
): Promise<{ success: boolean; points: number }> {
  let user: UserAccount | undefined;
  if (identifier) {
    const norm = identifier.toLowerCase().trim();
    user = usersDb.find((u) => u.id === identifier || u.email.toLowerCase() === norm);
  }
  if (!user) {
    user = usersDb.find((u) => u.role === "pelajar");
  }
  if (user) {
    user.points = (user.points ?? 0) + amount;
    persistUsersDb();
    return { success: true, points: user.points };
  }
  return { success: false, points: 0 };
}

export async function getRegisteredStudents() {
  await delay(200);
  return usersDb
    .filter((u) => u.role === "pelajar")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      nimNip: u.nimNip,
      institution: u.institution,
      points: u.points ?? 0,
      weakness: u.weakness,
    }))
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
}

export async function getRegisteredTeachers() {
  await delay(150);
  return usersDb
    .filter((u) => u.role === "pengajar")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      nimNip: u.nimNip,
      institution: u.institution,
    }));
}

export async function verifyUserCredentials(email: string, password: string) {
  await delay(200);
  const normalizedEmail = email.toLowerCase().trim();
  const user = usersDb.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    throw new Error("Akun tidak ditemukan. Silakan registrasi terlebih dahulu.");
  }
  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    throw new Error("Email atau kata sandi tidak valid.");
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    nimNip: user.nimNip,
    institution: user.institution,
  };
}

export async function registerUserAccount(data: {
  name: string;
  email: string;
  password: string;
  role: "pelajar" | "pengajar";
  nimNip?: string;
  institution?: string;
}) {
  await delay(400);
  const normalizedEmail = data.email.toLowerCase().trim();
  const existing = usersDb.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error("Email sudah terdaftar. Silakan gunakan email lain atau masuk langsung.");
  }

  const newUser: UserAccount = {
    id: `usr_${Date.now()}`,
    name: data.name.trim(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(data.password, 10),
    role: data.role,
    nimNip: data.nimNip || (data.role === "pelajar" ? "V3925xxx" : "199xxxxxxxxx"),
    institution: data.institution || "SD Negeri 1 Madiun",
    points: data.role === "pelajar" ? 200 : undefined,
    weakness:
      data.role === "pelajar"
        ? {
            chapterId: "pkn-sila3",
            chapterName: "Pelajaran PKn (Makna Sila Ke-3)",
            subject: "pkn",
            score: 8,
            outOf: 10,
            status: "tuntas",
            message:
              "Selamat belajar! Belum ada catatan remedial pada akunmu. Mulai eksplorasi belajarmu dari modul utama Makna Lambang Sila Ke-3 bersama Robot Pintar!",
          }
        : undefined,
  };
  usersDb.push(newUser);
  persistUsersDb();
  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    nimNip: newUser.nimNip,
    institution: newUser.institution,
    points: newUser.points,
    weakness: newUser.weakness,
  };
}

export async function deleteRegisteredStudent(id: string): Promise<boolean> {
  await delay(150);
  const idx = usersDb.findIndex((u) => (u.id === id || u.email === id) && u.role === "pelajar");
  if (idx === -1) {
    return false;
  }
  usersDb.splice(idx, 1);
  persistUsersDb();
  return true;
}

export async function getUserProfile(
  identifier?: string,
  fallbackRole: "pelajar" | "pengajar" = "pelajar"
) {
  await delay(100);
  let user: UserAccount | undefined;
  if (identifier) {
    const norm = identifier.toLowerCase().trim();
    user = usersDb.find((u) => u.id === identifier || u.email.toLowerCase() === norm);
  }
  if (!user) {
    user = usersDb.find((u) => u.role === fallbackRole);
  }
  if (!user) {
    return {
      id: "usr_guest",
      name:
        fallbackRole === "pelajar"
          ? "Ghandur Fauzan Ngauf Hisam"
          : "Darmawan Lahru Riatma, S.Kom., M.MT",
      email: fallbackRole === "pelajar" ? "ghandur@gmail.com" : "darmawan@gmail.com",
      role: fallbackRole,
      nimNip: fallbackRole === "pelajar" ? "V3925024" : "1991091420200801",
      institution: "D3 Teknik Informatika Madiun, Sekolah Vokasi UNS",
      points: 200,
    };
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    nimNip: user.nimNip,
    institution: user.institution,
    points: user.points ?? (user.role === "pelajar" ? 200 : undefined),
    weakness: user.weakness,
  };
}

export async function getUserProfileByRole(role: "pelajar" | "pengajar") {
  return getUserProfile(undefined, role);
}

export async function updateUserProfile(
  role: "pelajar" | "pengajar",
  payload: {
    name: string;
    email: string;
    nimNip?: string;
    institution?: string;
    password?: string;
  }
) {
  await delay(400);
  let user = usersDb.find((u) => u.role === role);
  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      name: payload.name,
      email: payload.email,
      passwordHash: payload.password || "secret123",
      role,
      nimNip: payload.nimNip || (role === "pelajar" ? "V3925024" : "1991091420200801"),
      institution: payload.institution || "D3 Teknik Informatika Madiun, Sekolah Vokasi UNS",
    };
    usersDb.push(user);
  } else {
    user.name = payload.name;
    user.email = payload.email;
    if (payload.nimNip) user.nimNip = payload.nimNip;
    if (payload.institution) user.institution = payload.institution;
    if (payload.password) user.passwordHash = payload.password;
  }
  persistUsersDb();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    nimNip: user.nimNip,
    institution: user.institution,
  };
}

// --- Entitas Manajemen Kelas (FR-21) ---------------------------------------
export interface ClassRoomRecord {
  id: string;
  name: string;
  code: string;
  semester: string;
  academicYear: string;
  studentCount: number;
  modulesCount: number;
}

const classRoomsDb: ClassRoomRecord[] = [
  {
    id: "cls_1",
    name: "Praktik Pemrograman Front-End (D3TI Madiun)",
    code: "TI-MAD-WEB",
    semester: "Semester Ganjil",
    academicYear: "2025/2026",
    studentCount: 50,
    modulesCount: 3,
  },
  {
    id: "cls_2",
    name: "Manajemen Proyek Teknologi Informasi",
    code: "TI-MAD-MPTI",
    semester: "Semester Ganjil",
    academicYear: "2025/2026",
    studentCount: 48,
    modulesCount: 4,
  },
  {
    id: "cls_3",
    name: "Analisis dan Perancangan Sistem (SKPL RAG)",
    code: "TI-MAD-APS",
    semester: "Semester Ganjil",
    academicYear: "2025/2026",
    studentCount: 52,
    modulesCount: 3,
  },
];

export async function getClassRooms(): Promise<ClassRoomRecord[]> {
  await delay(400);
  return [...classRoomsDb];
}

export async function createClassRoom(data: {
  name: string;
  code: string;
  semester?: string;
  academicYear?: string;
}): Promise<ClassRoomRecord> {
  await delay(500);
  const newClass: ClassRoomRecord = {
    id: `cls_${Date.now()}`,
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    semester: data.semester || "Semester Ganjil",
    academicYear: data.academicYear || "2025/2026",
    studentCount: 0,
    modulesCount: 1,
  };
  classRoomsDb.unshift(newClass);
  return newClass;
}

export async function deleteClassRoom(id: string): Promise<boolean> {
  await delay(400);
  const idx = classRoomsDb.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  classRoomsDb.splice(idx, 1);
  return true;
}

// --- Entitas Notifikasi Adaptif (FR-20) ------------------------------------
export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "success";
  link: string;
  isRead: boolean;
  createdAt: string;
  targetRole?: "pelajar" | "pengajar" | "all";
  icon?: string;
}

const notificationsDb: NotificationRecord[] = [
  // --- Notifikasi Murni Pengerjaan, Belajar, & Prestasi Siswa SD ---
  {
    id: "notif_pkn_quiz",
    title: "Misi Kuis Tantangan Sila Ke-3 🎯",
    message:
      "Yuk taklukkan kuis tantangan Persatuan Indonesia! Kumpulkan +30 Poin Prestasi & raih Capaian Juara Kelas.",
    type: "info",
    link: "/dashboard/pelajar/kuis",
    isRead: false,
    createdAt: "Baru saja",
    targetRole: "pelajar",
    icon: "info",
  },
  {
    id: "notif_coins_up",
    title: "Poin Prestasi Bertambah! ⭐",
    message:
      "Hebat! Kamu berhasil mengumpulkan poin prestasi dari pengerjaan misi belajar. Skor prestasimu semakin tinggi!",
    type: "success",
    link: "/dashboard/pelajar",
    isRead: false,
    createdAt: "10 menit lalu",
    targetRole: "pelajar",
    icon: "success",
  },
  {
    id: "notif_quiz_3levels",
    title: "Kuis Tantangan 3 Level Siap Dikerjakan! 🎮",
    message:
      "Uji kehebatanmu di Kuis Level 1 (Mudah), Level 2 (Sedang), dan Level 3 (Tantangan Juara) untuk meraih bintang emas!",
    type: "info",
    link: "/dashboard/pelajar/kuis",
    isRead: false,
    createdAt: "25 menit lalu",
    targetRole: "pelajar",
    icon: "info",
  },
  {
    id: "notif_lencana_unlocked",
    title: "Lencana Prestasi Baru Terbuka! 🏅",
    message:
      "Selamat! Kamu berhasil membuka lencana penghargaan baru setelah tekun belajar dan menuntaskan latihan soal.",
    type: "success",
    link: "/dashboard/pelajar",
    isRead: false,
    createdAt: "40 menit lalu",
    targetRole: "pelajar",
    icon: "success",
  },
  {
    id: "notif_robot_story",
    title: "Robot Pintar Siap Mendongeng 🤖",
    message:
      "Klik tombol 'Dengarkan Penjelasan Suara' di materi B. Jawa Punokawan untuk mendengarkan kisah luhur Semar & Petruk.",
    type: "info",
    link: "/dashboard/pelajar?chapter=bjawa-punokawan&mode=cerita",
    isRead: false,
    createdAt: "1 jam lalu",
    targetRole: "pelajar",
    icon: "info",
  },
  {
    id: "notif_misi_harian",
    title: "Misi Membaca Rangkuman Tuntas 📖",
    message:
      "Kamu telah membaca intisari materi hari ini. Poin belajarmu bertambah dan siap mencoba kuis tantangan!",
    type: "success",
    link: "/dashboard/pelajar",
    isRead: false,
    createdAt: "1 jam lalu",
    targetRole: "pelajar",
    icon: "success",
  },
  {
    id: "notif_remedial_gotong",
    title: "Latihan Tambahan: Gotong Royong 💪",
    message:
      "Skor latihan Gotong Royong masih perlu sedikit ditingkatkan. Yuk pelajari intisarinya lagi sebentar agar nilaimu sempurna 100!",
    type: "warning",
    link: "/dashboard/pelajar?chapter=pkn-gotongroyong&mode=cerita",
    isRead: false,
    createdAt: "2 jam lalu",
    targetRole: "pelajar",
    icon: "warning",
  },
  {
    id: "notif_ranking_naik",
    title: "Peringkat Juara Kelas Meningkat 🏆",
    message:
      "Hebat sekali! Akumulasi poin pengerjaan kuis membawamu naik ke peringkat atas di papan klasemen siswa kelas 4A.",
    type: "success",
    link: "/dashboard/pelajar",
    isRead: false,
    createdAt: "3 jam lalu",
    targetRole: "pelajar",
    icon: "success",
  },
];

export async function getNotifications(role?: string): Promise<NotificationRecord[]> {
  await delay(100);
  // Notifikasi difokuskan murni untuk pengerjaan murid (menghilangkan notifikasi teknis API atau fitur guru)
  return notificationsDb.filter((n) => {
    const text = `${n.title} ${n.message}`.toLowerCase();
    const isApiOrTeacher =
      n.targetRole === "pengajar" ||
      text.includes("api") ||
      text.includes("tervalidasi") ||
      text.includes("kurikulum kemdikbud") ||
      text.includes("disdikbud");
    if (isApiOrTeacher) return false;
    return n.targetRole === "pelajar" || n.targetRole === "all";
  });
}

export async function addNotification(record: {
  title: string;
  message: string;
  type: "warning" | "info" | "success";
  link: string;
  targetRole?: "pelajar" | "pengajar" | "all";
  icon?: string;
}): Promise<NotificationRecord> {
  await delay(100);
  const newNotif: NotificationRecord = {
    id: `notif_${Date.now()}`,
    title: record.title,
    message: record.message,
    type: record.type,
    link: record.link,
    isRead: false,
    createdAt: "Baru saja",
    targetRole: record.targetRole,
    icon: record.icon,
  };
  notificationsDb.unshift(newNotif);
  return newNotif;
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  await delay(200);
  const notif = notificationsDb.find((n) => n.id === id);
  if (!notif) return false;
  notif.isRead = true;
  return true;
}

// --- Ekspor Laporan Resmi Format PDF (HTML Print-Ready) (FR-18) ------------
export async function buildClassReportHtml(): Promise<{ fileName: string; content: string }> {
  await delay(600);
  const summary = await getClassSummary();
  const chapters = await getChapterProgress();
  const students = await getStudentsNeedingHelp();
  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Laporan Hasil Analitik Pembelajaran - ExplainMyLesson AI</title>
  <style>
    @media print {
      body { margin: 1.5cm; }
      .no-print { display: none; }
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #111;
      line-height: 1.5;
      padding: 30px;
      max-width: 900px;
      margin: 0 auto;
    }
    .kop {
      border-bottom: 3px double #000;
      padding-bottom: 15px;
      margin-bottom: 25px;
      text-align: center;
    }
    .kop h3 { margin: 0; font-size: 16pt; text-transform: uppercase; font-weight: bold; }
    .kop h2 { margin: 4px 0; font-size: 18pt; text-transform: uppercase; font-weight: bold; }
    .kop p { margin: 2px 0; font-size: 10.5pt; font-family: Arial, sans-serif; }
    .title { text-align: center; margin: 20px 0; }
    .title h1 { font-size: 14pt; text-decoration: underline; margin-bottom: 4px; text-transform: uppercase; }
    .title p { font-size: 11pt; margin: 0; font-style: italic; }
    .meta-table, .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-family: Arial, sans-serif;
      font-size: 10pt;
    }
    .meta-table td { padding: 4px 8px; vertical-align: top; }
    .data-table th, .data-table td {
      border: 1px solid #333;
      padding: 8px 12px;
      text-align: left;
    }
    .data-table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .badge-warn { color: #b91c1c; font-weight: bold; }
    .badge-good { color: #15803d; font-weight: bold; }
    .signatures {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      font-family: Arial, sans-serif;
      font-size: 11pt;
    }
    .sign-box { text-align: center; width: 250px; }
    .sign-box .space { height: 75px; }
    .btn-print {
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: right;">
    <button class="btn-print" onclick="window.print()">Cetak / Simpan sebagai PDF</button>
  </div>

  <div class="kop">
    <h3>PEMERINTAH KABUPATEN MADIUN</h3>
    <h3>DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
    <h2>SEKOLAH DASAR NEGERI 1 MADIUN</h2>
    <p>Jl. Pahlawan No. 10, Kota Madiun, Jawa Timur | Kode Pos: 63122 | NPSN: 20534120</p>
    <p>Email: sdn1madiun@kemdikbud.go.id | Akreditasi: A (Amat Baik)</p>
  </div>

  <div class="title">
    <h1>REKAPITULASI HASIL EVALUASI PEMBELAJARAN SISWA SD</h1>
    <p>Platform Pembelajaran Berbasis AI — Kurikulum Merdeka &amp; Muatan Lokal Jawa</p>
    <p style="font-weight: bold; margin-top: 4px;">Tahun Ajaran 2025/2026 — Semester Ganjil</p>
  </div>

  <table class="meta-table">
    <tr>
      <td style="width: 220px; font-weight: bold;">Satuan Pendidikan</td>
      <td style="width: 10px;">:</td>
      <td>SD Negeri 1 Madiun</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Kelas / Fase</td>
      <td>:</td>
      <td>Kelas 4A / Fase B (Sekolah Penggerak)</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Mata Pelajaran</td>
      <td>:</td>
      <td>Pendidikan Pancasila (PKn) dan Bahasa Jawa (Muatan Lokal)</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Guru Kelas / Pengampu</td>
      <td>:</td>
      <td>Bpk. Darmawan, S.Pd.SD (NIP. 198506122010011012)</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Integrasi Kurikulum</td>
      <td>:</td>
      <td>API SIBI Kemdikbudristek RI &amp; Repositori Mulok Disdikbud Provinsi</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Waktu Cetak Laporan</td>
      <td>:</td>
      <td>${dateStr}</td>
    </tr>
  </table>

  <h4 style="font-family: Arial, sans-serif; margin-bottom: 6px;">I. Ringkasan Eksekutif Kelas 4A</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th>Indikator Metrik</th>
        <th>Nilai Agregat</th>
        <th>Standar Ketuntasan</th>
        <th>Status Evaluasi</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Siswa SD Terdaftar</td>
        <td><strong>${summary.totalStudents} Siswa</strong></td>
        <td>50 Siswa</td>
        <td><span class="badge-good">100% Aktif Belajar</span></td>
      </tr>
      <tr>
        <td>Rata-Rata Capaian Pemahaman</td>
        <td><strong>${summary.averageComprehension}%</strong></td>
        <td>≥ 70% (KKTP)</td>
        <td><span class="badge-good">Memenuhi Standar Ketercapaian</span></td>
      </tr>
      <tr>
        <td>Modul Kurikulum Aktif</td>
        <td><strong>${summary.activeModules} Modul Resmi API</strong></td>
        <td>Kurikulum Merdeka &amp; Mulok</td>
        <td><span class="badge-good">Terintegrasi RAG Adaptif</span></td>
      </tr>
      <tr>
        <td>Siswa Memerlukan Bimbingan Khusus</td>
        <td><strong>${summary.studentsNeedingIntervention} Siswa</strong></td>
        <td>Skor Kuis &lt; 60</td>
        <td><span class="badge-warn">Program Remedial Terjadwal</span></td>
      </tr>
    </tbody>
  </table>

  <h4 style="font-family: Arial, sans-serif; margin-bottom: 6px; margin-top: 24px;">II. Capaian Tingkat Pemahaman Per Bab Pembelajaran</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 50px;">No</th>
        <th>Mata Pelajaran &amp; Bab Pembelajaran</th>
        <th style="width: 140px;">Tingkat Pemahaman</th>
        <th style="width: 160px;">Kategori Evaluasi</th>
      </tr>
    </thead>
    <tbody>
      ${chapters
        .map(
          (c, i) => `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td><strong>${c.name}</strong></td>
          <td><strong>${c.percent}%</strong></td>
          <td>${c.percent >= 75 ? '<span class="badge-good">Tuntas (Pemahaman Tinggi)</span>' : c.percent >= 70 ? '<span class="badge-good">Tuntas (Pemahaman Baik)</span>' : '<span class="badge-warn">Perlu Remedial / Bimbingan</span>'}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h4 style="font-family: Arial, sans-serif; margin-bottom: 6px; margin-top: 24px;">III. Daftar Siswa Dalam Program Bimbingan Remedial</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 50px;">No</th>
        <th>Nama Siswa</th>
        <th>Materi Terkendala</th>
        <th>Skor Kuis Terakhir</th>
        <th>Tindakan &amp; Rekomendasi Guru</th>
      </tr>
    </thead>
    <tbody>
      ${students
        .map(
          (s, i) => `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td><strong>${s.name}</strong> (Kelas 4A)</td>
          <td>${s.chapter}</td>
          <td><span class="badge-warn">${s.score} / ${s.outOf}</span></td>
          <td>Diberikan modul ringkasan audio penjelasan robot &amp; latihan soal dasar Level 1</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h4 style="font-family: Arial, sans-serif; margin-bottom: 6px; margin-top: 24px;">IV. Rekapitulasi Prestasi &amp; Keaktifan Belajar Siswa Kelas 4A</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 80px; text-align: center;">Peringkat</th>
        <th>NISN / Nama Lengkap Siswa</th>
        <th style="width: 140px; text-align: center;">Skor Keaktifan (Poin)</th>
        <th style="width: 170px;">Predikat &amp; Evaluasi</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: center;"><strong>Peringkat 1</strong></td>
        <td><strong>Raditya Pratama</strong> <span style="font-size: 9pt; color: #555;">(NISN: 0148291023)</span></td>
        <td style="text-align: center;"><strong>430 Poin</strong></td>
        <td><span class="badge-good">Sangat Memuaskan (A)</span></td>
      </tr>
      <tr>
        <td style="text-align: center;">Peringkat 2</td>
        <td><strong>Budi Santoso</strong> <span style="font-size: 9pt; color: #555;">(NISN: 0148291045)</span></td>
        <td style="text-align: center;">360 Poin</td>
        <td><span class="badge-good">Baik (B+)</span></td>
      </tr>
      <tr>
        <td style="text-align: center;">Peringkat 3</td>
        <td><strong>Siti Aminah</strong> <span style="font-size: 9pt; color: #555;">(NISN: 0148291078)</span></td>
        <td style="text-align: center;">310 Poin</td>
        <td><span class="badge-good">Baik (B)</span></td>
      </tr>
      <tr>
        <td style="text-align: center;">Peringkat 4</td>
        <td><strong>Ahmad Fauzi</strong> <span style="font-size: 9pt; color: #555;">(NISN: 0148291089)</span></td>
        <td style="text-align: center;">270 Poin</td>
        <td><span class="badge-good">Cukup Baik (B-)</span></td>
      </tr>
    </tbody>
  </table>

  <div class="signatures">
    <div class="sign-box">
      <p>Mengetahui,<br />Kepala SD Negeri 1 Madiun,</p>
      <div class="space"></div>
      <p><strong>Hj. Sri Wahyuni, M.Pd.</strong><br />NIP. 197204151996032001</p>
    </div>
    <div class="sign-box">
      <p>Madiun, ${dateStr}<br />Guru Kelas 4A,</p>
      <div class="space"></div>
      <p><strong>Bpk. Darmawan, S.Pd.SD</strong><br />NIP. 198506122010011012</p>
    </div>
  </div>
</body>
</html>`;

  return {
    fileName: `Laporan_Evaluasi_Siswa_SDN1Madiun_${Date.now()}.html`,
    content: html,
  };
}
