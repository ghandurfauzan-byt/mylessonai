// backend/server/gameGenerator.ts
// Generator Game Edukasi Adaptif Berbasis Materi Kurikulum (Kemendikbud & Upload Mandiri Guru)
//
// Fitur:
// 1. Deteksi Cerdas Mode Game Terbaik (Petualangan 3D, Menjodohkan, Tebak Kata, Ular Tangga)
// 2. Narasi & Voice Penjelasan Materi Pak Guru (Web Speech API id-ID)
// 3. Panduan Cara Bermain Tiap Game
// 4. Data Set Lengkap 4 Game Edukasi Ramah Anak SD:
//    - Petualangan Desa 3D (5 Pos Misi Checkpoint kontekstual)
//    - Menjodohkan Kartu Pasangan (Matching Pair Puzzle)
//    - Tebak Kata Ceria (Scrambled Word Puzzle dengan Petunjuk)
//    - Ular Tangga Edukasi (30 Petak dengan Dadu & Kotak Tantangan Soal)

export interface GameOption {
  id: string;
  teks: string;
  benar: boolean;
  penjelasan: string;
}

export interface GameCheckpoint {
  id: string;
  namaPos: string;
  tempat: string;
  tokohNama: string;
  tokohAvatar: string;
  nomorPos: number;
  simbol: string;
  zPos: number;
  xPos: number;
  warnaKhas: string;
  pertanyaan: string;
  opsi: GameOption[];
}

export interface MatchingCardPair {
  id: string;
  term: string;
  match: string;
  category: string;
  hint: string;
}

export interface TebakKataChallenge {
  id: string;
  word: string; // kata target huruf kapital
  scrambled: string[]; // array huruf acak
  clue: string;
  explanation: string;
  points: number;
}

export interface UlarTanggaQuestion {
  tileNumber: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AdaptiveGamePackage {
  chapterId: string;
  chapterTitle: string;
  subject: string;
  recommendedMode: "adventure" | "matching" | "tebak_kata" | "ular_tangga";
  teacherExplanation: {
    summaryText: string;
    voiceScript: string;
    points: string[];
  };
  gameGuides: {
    adventure: string;
    matching: string;
    tebak_kata: string;
    ular_tangga: string;
  };
  adventureCheckpoints: GameCheckpoint[];
  matchingPairs: MatchingCardPair[];
  tebakKataChallenges: TebakKataChallenge[];
  ularTangga: {
    totalTiles: number;
    ladders: Record<number, number>; // tileStart -> tileEnd
    snakes: Record<number, number>; // tileStart -> tileEnd
    quizTiles: Record<number, UlarTanggaQuestion>;
  };
}

export function generateAdaptiveGameData(input: {
  chapterId?: string;
  chapterTitle?: string;
  subject?: string;
  learningGoal?: string;
  ragSummary?: string[];
}): AdaptiveGamePackage {
  const chapterId = input.chapterId || "mod-pkn-sila3";
  const chapterTitle = input.chapterTitle || "Makna Lambang Sila Ke-3: Persatuan Indonesia di Sekolah & Rumah";
  const subject = input.subject || "pkn";
  const ragSummary = input.ragSummary || [];
  const learningGoal = input.learningGoal || "Memahami nilai-nilai kebaikan dan mengamalkannya dalam kehidupan sehari-hari.";

  const textLower = (chapterTitle + " " + (input.ragSummary?.join(" ") || "")).toLowerCase();

  // 1. Deteksi Karakteristik Materi
  const isJawa =
    subject.toLowerCase().includes("jawa") ||
    textLower.includes("jawa") ||
    textLower.includes("aksara") ||
    textLower.includes("pandhawa") ||
    textLower.includes("unggah");

  const isGotongRoyong = textLower.includes("gotong royong") || textLower.includes("kerja sama") || textLower.includes("piket");
  const isToleransi = textLower.includes("toleransi") || textLower.includes("agama") || textLower.includes("ibadah");
  const isNorma = textLower.includes("norma") || textLower.includes("aturan") || textLower.includes("tertib");
  const isPancasila = textLower.includes("sila") || textLower.includes("pancasila") || textLower.includes("garuda");

  // Mode rekomendasi awal
  let recommendedMode: "adventure" | "matching" | "tebak_kata" | "ular_tangga" = "adventure";
  if (isJawa && (textLower.includes("aksara") || textLower.includes("kirtya"))) {
    recommendedMode = "matching";
  } else if (isNorma) {
    recommendedMode = "ular_tangga";
  } else if (textLower.includes("kata") || textLower.includes("istilah")) {
    recommendedMode = "tebak_kata";
  }

  // 2. Penjelasan Materi Pak Guru & Voice
  const pointsList = ragSummary.length > 0
    ? ragSummary.slice(0, 5)
    : [
        `Tujuan Pembelajaran: ${learningGoal}`,
        "Pahami nilai-nilai penting yang ada dalam materi ini dan terapkan saat berinteraksi dengan sesama.",
        "Kerjakan setiap tantangan game dengan teliti untuk mengumpulkan poin emas dan bintang prestasi!",
      ];

  const teacherVoiceScript = `Halo Penjelajah Cilik! Hari ini kita belajar materi seru tentang ${chapterTitle}. ${
    pointsList[0] ? pointsList[0].slice(0, 160) : ""
  } Yuk mainkan game petualangan, kuis mencocokkan, tebak kata, atau ular tangga untuk menguji pemahamanmu! Semangat belajar ya!`;

  // 3. Panduan Bermain Tiap Game
  const gameGuides = {
    adventure:
      "🎮 Gunakan tombol WASD atau tombol Panah di layar untuk berjalan. Tekan SPASI untuk melompat, SHIFT untuk berlari cepat. Temui Pak Guru di kiri gapura dan kunjungi 5 pos misi di sepanjang jalan. Tekan 'E' untuk menjawab kuis dan sapa teman sekelasmu!",
    matching:
      "🧩 Klik pada dua kartu untuk membalik dan mencocokkan pasangan yang sesuai (misal: istilah dengan maknanya, atau aksara dengan bunyinya). Selesaikan semua pasangan secepat mungkin untuk meraih bintang 3!",
    tebak_kata:
      "🔤 Perhatikan petunjuk yang diberikan, lalu klik huruf-huruf acak secara berurutan untuk menyusun kata konsep materi yang benar. Jika ragu, klik tombol Petunjuk!",
    ular_tangga:
      "🎲 Lempar dadu untuk menggerakkan pionmu di papan 30 petak. Manfaatkan tangga untuk melesat naik, hindari jebakan ular! Jika berhenti di Kotak Kuis (?), jawab pertanyaan materi dengan tepat untuk mendapat bonus poin!",
  };

  // 4. Data Pos Petualangan 3D (5 Checkpoints)
  let adventureCheckpoints: GameCheckpoint[] = [];

  if (isJawa) {
    adventureCheckpoints = [
      {
        id: "pos1",
        namaPos: "Pos Punokawan Semar",
        tempat: "Padepokan Budi Pekerti",
        tokohNama: "Kyai Semar",
        tokohAvatar: "👴",
        nomorPos: 1,
        simbol: "📜",
        zPos: -45,
        xPos: 14,
        warnaKhas: "#38bdf8",
        pertanyaan: "Nalika matur marang bapak utawa ibu guru, basa kang becik lan trapsila digunakake yaiku:",
        opsi: [
          { id: "A", teks: "Basa Ngoko Lugu", benar: false, penjelasan: "Ngoko lugu digunakake kanggo kanca sebaya." },
          { id: "B", teks: "Basa Krama Alus", benar: true, penjelasan: "Pinter banget! Basa Krama Alus ngurmati wong kang luwih tuwa." },
          { id: "C", teks: "Basa Indonesia campuran", benar: false, penjelasan: "Yen sinau Basa Jawa, kudu gladhen krama alus." },
        ],
      },
      {
        id: "pos2",
        namaPos: "Pos Kesatria Werkudara",
        tempat: "Ksatrian Jodhipati",
        tokohNama: "Raden Werkudara",
        tokohAvatar: "🧔",
        nomorPos: 2,
        simbol: "⚔️",
        zPos: -105,
        xPos: -14,
        warnaKhas: "#fb923c",
        pertanyaan: "Raden Werkudara nduweni watak kesatria kang luhur, yaiku:",
        opsi: [
          { id: "A", teks: "Jujur, kendel mbelani bebener, lan ora tau goroh", benar: true, penjelasan: "Leres! Werkudara tansah mbelani bebener lan tresna marang sedulure." },
          { id: "B", teks: "Seneng ngapusi lan pamer kasekten", benar: false, penjelasan: "Kuwi dudu watake kesatria Pandhawa." },
          { id: "C", teks: "Wedi getih lan mlayu saka perang", benar: false, penjelasan: "Werkudara ora tau wedi marang bebaya." },
        ],
      },
      {
        id: "pos3",
        namaPos: "Pos Aksara Jawa Hanacaraka",
        tempat: "Bale Sastra Jawa",
        tokohNama: "Empu Sedah",
        tokohAvatar: "🧑‍🏫",
        nomorPos: 3,
        simbol: "✍️",
        zPos: -165,
        xPos: 14,
        warnaKhas: "#4ade80",
        pertanyaan: "Cacahing Aksara Jawa Legena (dhasar) kang kudu diweruhi ana pira?",
        opsi: [
          { id: "A", teks: "10 Aksara", benar: false, penjelasan: "Kurang, aksara Jawa luwih saka sepuluh." },
          { id: "B", teks: "15 Aksara", benar: false, penjelasan: "Isih kurang trep." },
          { id: "C", teks: "20 Aksara (Ha nganti Nga)", benar: true, penjelasan: "Bener banget! Ana 20 aksara wiwit Ha Na Ca Ra Ka nganti Ma Ga Ba Tha Nga." },
        ],
      },
      {
        id: "pos4",
        namaPos: "Pos Sandhangan Swara",
        tempat: "Taman Pasinaon",
        tokohNama: "Dewi Sinta",
        tokohAvatar: "👸",
        nomorPos: 4,
        simbol: "🌺",
        zPos: -225,
        xPos: -14,
        warnaKhas: "#f87171",
        pertanyaan: "Sandhangan swara kang ndadekake aksara unine dadi 'u' yaiku diarani:",
        opsi: [
          { id: "A", teks: "Wulu (swara i)", benar: false, penjelasan: "Wulu ngowahi swara dadi 'i'." },
          { id: "B", teks: "Suku (swara u)", benar: true, penjelasan: "Pinter! Sandhangan Suku manggone ing ngisor aksara kanggo swara 'u'." },
          { id: "C", teks: "Taling (swara é)", benar: false, penjelasan: "Taling kanggo swara 'é'." },
        ],
      },
      {
        id: "pos5",
        namaPos: "Pos Guyub Rukun Kampung",
        tempat: "Pendhapa Ageng Desa",
        tokohNama: "Lurah Wanantara",
        tokohAvatar: "👳",
        nomorPos: 5,
        simbol: "🌾",
        zPos: -285,
        xPos: 14,
        warnaKhas: "#facc15",
        pertanyaan: "Sikap 'rukun agawe santosa, crah agawe bubrah' nduweni piwulang:",
        opsi: [
          { id: "A", teks: "Seneng pasulayan marang kanca", benar: false, penjelasan: "Pasulayan ndadekake bubrah lan rusak." },
          { id: "B", teks: "Dhewe-dhewe ora gelem srawung", benar: false, penjelasan: "Manungsa iku makhluk sosial kudu srawung." },
          { id: "C", teks: "Yen rukun ndadekake kuwat, yen congkrah ndadekake rusak", benar: true, penjelasan: "Hebat! Kerukunan ndadekake bangsa kuwat lan sentosa." },
        ],
      },
    ];
  } else if (isGotongRoyong) {
    adventureCheckpoints = [
      {
        id: "pos1",
        namaPos: "Pos Piket Ruang Kelas",
        tempat: "Gedung Sekolah SD Merah Putih",
        tokohNama: "Ibu Guru Melati",
        tokohAvatar: "👩‍🏫",
        nomorPos: 1,
        simbol: "🧹",
        zPos: -45,
        xPos: 14,
        warnaKhas: "#38bdf8",
        pertanyaan: "Saat jam pulang sekolah, giliran kelompok piketmu membersihkan kelas. Sikap gotong royong yang benar:",
        opsi: [
          { id: "A", teks: "Langsung pulang duluan dan membiarkan teman menyapu sendirian.", benar: false, penjelasan: "Tidak bertanggung jawab dan merugikan teman sekelas." },
          { id: "B", teks: "Membagi tugas (ada yang menyapu, mengepel, menghapus papan tulis) bersama-sama.", benar: true, penjelasan: "Hebat! Gotong royong membuat pekerjaan kelas cepat beres dan bersih!" },
          { id: "C", teks: "Duduk santai di atas meja sambil menonton kawan bekerja.", benar: false, penjelasan: "Kita harus aktif bekerja sama, bukan hanya menonton." },
        ],
      },
      {
        id: "pos2",
        namaPos: "Pos Kebun Hijau Sekolah",
        tempat: "Taman & Apotek Hidup",
        tokohNama: "Pak Bon Kebun",
        tokohAvatar: "👨‍🌾",
        nomorPos: 2,
        simbol: "🌱",
        zPos: -105,
        xPos: -14,
        warnaKhas: "#4ade80",
        pertanyaan: "Sekolah sedang mengadakan program penghijauan menanam pohon. Nilai kerja sama yang dapat kamu lakukan:",
        opsi: [
          { id: "A", teks: "Bahu-membahu menyiram bibit tanaman dan membersihkan rumput liar.", benar: true, penjelasan: "Luar biasa! Kerja sama menjaga lingkungan sekolah asri dan sejuk." },
          { id: "B", teks: "Mencabut tanaman yang baru ditanam kawan agar tidak lelah.", benar: false, penjelasan: "Merusak tanaman merugikan seluruh warga sekolah." },
          { id: "C", teks: "Menginjak-injak taman sambil berkejaran.", benar: false, penjelasan: "Taman harus dirawat bersama dengan penuh kasih sayang." },
        ],
      },
      {
        id: "pos3",
        namaPos: "Pos Perpustakaan Ceria",
        tempat: "Ruang Baca Sekolah",
        tokohNama: "Kak Pustakawan",
        tokohAvatar: "📚",
        nomorPos: 3,
        simbol: "📖",
        zPos: -165,
        xPos: 14,
        warnaKhas: "#fb923c",
        pertanyaan: "Buku-buku di rak perpustakaan baru saja datang dan masih di kardus besar. Bagaimana sikap terbaik?",
        opsi: [
          { id: "A", teks: "Berpura-pura tidak melihat kardus tersebut.", benar: false, penjelasan: "Sikap acuh tak acuh bukan cerminan Pelajar Pancasila." },
          { id: "B", teks: "Menyobek kardus dan membuat buku berantakan di lantai.", benar: false, penjelasan: "Tindakan merusak dan tidak tertib." },
          { id: "C", teks: "Bersama teman membantu mengangkat dan menata buku rapi di rak sesuai abjad.", benar: true, penjelasan: "Sangat bijak! 'Berat sama dipikul, ringan sama dijinjing'." },
        ],
      },
      {
        id: "pos4",
        namaPos: "Pos Dapur & Rumah Tangga",
        tempat: "Perumahan Warga Ramah",
        tokohNama: "Bunda Larasati",
        tokohAvatar: "👩",
        nomorPos: 4,
        simbol: "🍲",
        zPos: -225,
        xPos: -14,
        warnaKhas: "#f87171",
        pertanyaan: "Di rumah, Ibu sedang sibuk menyiapkan makan malam sementara cucian piring menumpuk. Aksi gotong royongmu:",
        opsi: [
          { id: "A", teks: "Bermain game di ponsel dan meminta dilayani dengan cepat.", benar: false, penjelasan: "Sebagai anak yang berbakti, kita harus meringankan beban orang tua." },
          { id: "B", teks: "Inisiatif membantu mencuci piring dan merapikan meja makan tanpa disuruh.", benar: true, penjelasan: "Keren sekali! Membantu orang tua adalah bentuk gotong royong di rumah." },
          { id: "C", teks: "Mengunci diri di kamar agar tidak dimintai tolong.", benar: false, penjelasan: "Kerja sama keluarga menjaga kehangatan dan kerukunan di rumah." },
        ],
      },
      {
        id: "pos5",
        namaPos: "Pos Kerja Bakti Desa",
        tempat: "Balai RW & Pos Ronda",
        tokohNama: "Pak RW Sukirno",
        tokohAvatar: "👴",
        nomorPos: 5,
        simbol: "🤝",
        zPos: -285,
        xPos: 14,
        warnaKhas: "#facc15",
        pertanyaan: "Warga lingkungan mengadakan kerja bakti membersihkan selokan agar tidak banjir saat musim hujan. Sikapmu:",
        opsi: [
          { id: "A", teks: "Membuang sampah plastik tambahan ke dalam selokan.", benar: false, penjelasan: "Membuang sampah di selokan menyebabkan bencana banjir." },
          { id: "B", teks: "Tidur sepanjang hari dan tidak peduli pada lingkungan sekitar.", benar: false, penjelasan: "Kita adalah bagian dari masyarakat yang harus peduli sesama." },
          { id: "C", teks: "Ikut serta membantu memungut sampah kering atau membagikan minuman untuk warga.", benar: true, penjelasan: "Teladan yang hebat! Gotong royong membuat lingkungan sehat dan rukun!" },
        ],
      },
    ];
  } else if (isToleransi) {
    adventureCheckpoints = [
      {
        id: "pos1",
        namaPos: "Pos Kerukunan Sekolah",
        tempat: "Gerbang Bhinneka",
        tokohNama: "Pak Guru Damai",
        tokohAvatar: "👨‍🏫",
        nomorPos: 1,
        simbol: "⭐",
        zPos: -45,
        xPos: 14,
        warnaKhas: "#38bdf8",
        pertanyaan: "Di kelas ada teman yang berbeda agama sedang berdoa sebelum pelajaran dimulai. Sikap toleransi kita:",
        opsi: [
          { id: "A", teks: "Mengajaknya mengobrol keras-keras saat ia khusyuk berdoa.", benar: false, penjelasan: "Mengganggu teman yang sedang berdoa melanggar etika beragama." },
          { id: "B", teks: "Menjaga keheningan dan menghormati tata cara ibadahnya.", benar: true, penjelasan: "Toleransi sejati! Saling menghormati kebebasan beribadah." },
          { id: "C", teks: "Menyuruhnya mengganti cara berdoa agar sama dengan kita.", benar: false, penjelasan: "Kita tidak boleh memaksakan keyakinan kepada orang lain." },
        ],
      },
      {
        id: "pos2",
        namaPos: "Pos Sahabat Lintas Agama",
        tempat: "Kantin Kejujuran",
        tokohNama: "Made Wijaya",
        tokohAvatar: "🧒",
        nomorPos: 2,
        simbol: "🤝",
        zPos: -105,
        xPos: -14,
        warnaKhas: "#fb923c",
        pertanyaan: "Kawanmu sedang menjalankan ibadah puasa sesuai agamanya. Tindakan empati yang tepat saat istirahat:",
        opsi: [
          { id: "A", teks: "Tidak sengaja makan atau minum di depannya secara berlebihan untuk menggoda.", benar: true, penjelasan: "Sikap terpuji! Tenggang rasa (tepa selira) membuat kawan merasa dihargai." },
          { id: "B", teks: "Memaksa kawan membatalkan puasanya.", benar: false, penjelasan: "Melanggar hak beribadah kawan." },
          { id: "C", teks: "Menjauhinya dan tidak mau berteman lagi.", benar: false, penjelasan: "Perbedaan agama bukan alasan untuk memutus pertemanan." },
        ],
      },
      {
        id: "pos3",
        namaPos: "Pos Rumah Ibadah Harmoni",
        tempat: "Kompleks 6 Rumah Ibadah",
        tokohNama: "Ustadz & Pendeta Fiktif",
        tokohAvatar: "🏛️",
        nomorPos: 3,
        simbol: "🕊️",
        zPos: -165,
        xPos: 14,
        warnaKhas: "#4ade80",
        pertanyaan: "Pasal 29 Ayat (2) UUD 1945 menjamin kemerdekaan tiap-tiap penduduk untuk:",
        opsi: [
          { id: "A", teks: "Memilih dan beribadat sesuai agama dan kepercayaannya masing-masing.", benar: true, penjelasan: "Tepat sekali! Hak asasi beragama dijamin undang-undang dasar negara." },
          { id: "B", teks: "Melarang orang lain membangun tempat ibadah.", benar: false, penjelasan: "Diskriminasi dilarang oleh hukum." },
          { id: "C", teks: "Tidak mematuhi hukum negara jika berbeda pendapat.", benar: false, penjelasan: "Semua warga wajib tunduk pada hukum negara." },
        ],
      },
      {
        id: "pos4",
        namaPos: "Pos Hari Raya & Budaya",
        tempat: "Alun-Alun Bhinneka",
        tokohNama: "Kak Meilani",
        tokohAvatar: "👧",
        nomorPos: 4,
        simbol: "🎉",
        zPos: -225,
        xPos: -14,
        warnaKhas: "#f87171",
        pertanyaan: "Saat tetangga merayakan hari besar keagamaannya, sikap bertetangga yang rukun adalah:",
        opsi: [
          { id: "A", teks: "Menyalakan petasan bising di depan rumahnya.", benar: false, penjelasan: "Mengganggu ketenteraman tetangga." },
          { id: "B", teks: "Mengucapkan selamat dengan santun dan ikut menjaga keamanan lingkungannya.", benar: true, penjelasan: "Harmoni yang indah! Kerukunan antarumat beragama memperkokoh persatuan." },
          { id: "C", teks: "Menutup jalan agar tetangga tidak bisa merayakan.", benar: false, penjelasan: "Tindakan intoleran yang dilarang." },
        ],
      },
      {
        id: "pos5",
        namaPos: "Pos Duta Perdamaian",
        tempat: "Monumen Persaudaraan",
        tokohNama: "Bung Garuda",
        tokohAvatar: "🦅",
        nomorPos: 5,
        simbol: "✨",
        zPos: -285,
        xPos: 14,
        warnaKhas: "#facc15",
        pertanyaan: "Apa semboyan pemersatu bangsa yang mengajarkan persatuan di tengah keberagaman keyakinan dan suku?",
        opsi: [
          { id: "A", teks: "Tut Wuri Handayani", benar: false, penjelasan: "Semboyan pendidikan nasional." },
          { id: "B", teks: "Bhinneka Tunggal Ika", benar: true, penjelasan: "Berbeda-beda tetapi tetap satu jua! Pilar utama kerukunan Indonesia." },
          { id: "C", teks: "Ing Ngarso Sung Tulodo", benar: false, penjelasan: "Semboyan keteladanan pemimpin." },
        ],
      },
    ];
  } else {
    // Default: 5 Pos Suku Nusantara / Pancasila
    adventureCheckpoints = [
      {
        id: "jawa",
        namaPos: "Pos Suku Jawa (Rumah Joglo)",
        tempat: "Pelataran Candi & Rumah Joglo",
        tokohNama: "Kakek Raden",
        tokohAvatar: "👴",
        nomorPos: 1,
        simbol: "⭐",
        zPos: -45,
        xPos: 14,
        warnaKhas: "#38bdf8",
        pertanyaan: "Di desa, ada teman berbeda keyakinan yang sedang menjalankan ibadah doa. Nilai Sila ke-1 mengajarkan kita untuk:",
        opsi: [
          { id: "A", teks: "Bermain petasan di dekat tempat ibadah agar ramai.", benar: false, penjelasan: "Tidak sopan. Tempat ibadah harus dijaga kesucian dan ketenangannya." },
          { id: "B", teks: "Menjaga ketenangan dan menghormati ibadahnya dengan ramah.", benar: true, penjelasan: "Sangat bijak! Sila 1 mengajarkan toleransi dan kerukunan antarumat beragama." },
          { id: "C", teks: "Menyuruhnya berhenti karena berbeda cara berdoanya.", benar: false, penjelasan: "Keliru. Kita tidak boleh memaksakan keyakinan kepada orang lain." },
        ],
      },
      {
        id: "sunda",
        namaPos: "Pos Suku Sunda (Rumah Panggung)",
        tempat: "Perkampungan Pasundan",
        tokohNama: "Kang Asep",
        tokohAvatar: "🧑",
        nomorPos: 2,
        simbol: "⛓️",
        zPos: -105,
        xPos: -14,
        warnaKhas: "#fb923c",
        pertanyaan: "Kamu melihat seorang kawan jatuh terpeleset di jalan bebatuan dan bukunya berserakan. Sikap kemanusiaanmu:",
        opsi: [
          { id: "A", teks: "Segera menolongnya berdiri dan merapikan buku-bukunya dengan ikhlas.", benar: true, penjelasan: "Luar biasa! Sila 2 mengajarkan tolong-menolong dengan kasih sayang." },
          { id: "B", teks: "Menertawakannya dan membiarkannya menangis sendirian.", benar: false, penjelasan: "Menertawakan kemalangan orang lain bertentangan dengan adab kemanusiaan." },
          { id: "C", teks: "Meminta uang saku dulu baru bersedia menolong.", benar: false, penjelasan: "Menolong sesama harus didasari niat tulus tanpa pamrih." },
        ],
      },
      {
        id: "minang",
        namaPos: "Pos Suku Minang (Rumah Gadang)",
        tempat: "Ranah Minang Gonjong",
        tokohNama: "Uda Buyung",
        tokohAvatar: "🤠",
        nomorPos: 3,
        simbol: "🌳",
        zPos: -165,
        xPos: 14,
        warnaKhas: "#4ade80",
        pertanyaan: "Ada kawan baru yang berasal dari pulau seberang dan logat bicaranya berbeda. Nilai Persatuan Indonesia mengajarkan:",
        opsi: [
          { id: "A", teks: "Menjauhinya dan membentuk kelompok yang hanya dari satu suku saja.", benar: false, penjelasan: "Sikap eksklusif memecah belah persatuan bangsa." },
          { id: "B", teks: "Mengejek logat dan pakaian adat daerah asalnya.", benar: false, penjelasan: "Mengejek budaya daerah kawan melanggar persatuan nasional." },
          { id: "C", teks: "Menyambutnya hangat, mengajaknya bermain rukun: Bhinneka Tunggal Ika!", benar: true, penjelasan: "Bhinneka Tunggal Ika! Perbedaan suku adalah kekayaan pemersatu bangsa." },
        ],
      },
      {
        id: "dayak",
        namaPos: "Pos Suku Dayak (Rumah Betang)",
        tempat: "Hutan Adat Betang Panjang",
        tokohNama: "Kepala Suku Kaian",
        tokohAvatar: "🧓",
        nomorPos: 4,
        simbol: "🐂",
        zPos: -225,
        xPos: -14,
        warnaKhas: "#f87171",
        pertanyaan: "Kelasmu sedang menentukan tujuan karya wisata. Banyak usulan yang berbeda-beda. Cara mengambil keputusan terbaik:",
        opsi: [
          { id: "A", teks: "Ketua kelas memaksa semua murid mengikuti kemauan pribadinya.", benar: false, penjelasan: "Pemaksaan kehendak melanggar hak demokrasi Sila 4." },
          { id: "B", teks: "Musyawarah mufakat, mendengarkan semua usulan, dan mengambil keputusan bersama.", benar: true, penjelasan: "Musyawarah mufakat menjunjung tinggi kebijaksanaan dan kebersamaan." },
          { id: "C", teks: "Ribut bertengkar dan membatalkan kegiatan sama sekali.", benar: false, penjelasan: "Pertengkaran merusak kerukunan yang seharusnya dibangun lewat musyawarah." },
        ],
      },
      {
        id: "papua",
        namaPos: "Pos Suku Papua (Rumah Honai)",
        tempat: "Lembah Asri Honai",
        tokohNama: "Kaka Pace",
        tokohAvatar: "🧔",
        nomorPos: 5,
        simbol: "🌾",
        zPos: -285,
        xPos: 14,
        warnaKhas: "#facc15",
        pertanyaan: "Hasil panen kebun sekolah sangat melimpah berkat kerja bakti seluruh siswa. Pembagian yang adil adalah:",
        opsi: [
          { id: "A", teks: "Semua hasil panen dibawa pulang oleh satu orang saja.", benar: false, penjelasan: "Tindakan serakah melanggar keadilan sosial." },
          { id: "B", teks: "Menjual hasil panen secara diam-diam tanpa izin teman-teman.", benar: false, penjelasan: "Tidak jujur dan melanggar hak bersama." },
          { id: "C", teks: "Membagi hasil panen secara merata dan dinikmati bersama seluruh siswa.", benar: true, penjelasan: "Keadilan sosial terwujud nyata! Semua yang bekerja keras berhak menikmati hasil bersama." },
        ],
      },
    ];
  }

  // 5. Data Menjodohkan Kartu (Matching Pairs)
  let matchingPairs: MatchingCardPair[] = [];
  if (isJawa) {
    matchingPairs = [
      { id: "p1", term: "Aksara Ha-Na-Ca-Ra-Ka", match: "20 Aksara Dhasar Jawa Legena", category: "Aksara", hint: "Jumlah aksara dasar Jawa" },
      { id: "p2", term: "Sandhangan Wulu", match: "Swara 'i' ing Aksara", category: "Sandhangan", hint: "Ngowahi swara dadi i" },
      { id: "p3", term: "Sandhangan Suku", match: "Swara 'u' ing Aksara", category: "Sandhangan", hint: "Manggon ing ngisor aksara" },
      { id: "p4", term: "Raden Puntadewa", match: "Watak Jujur Ora Tau Goroh", category: "Tokoh", hint: "Pembarepe Pandhawa" },
      { id: "p5", term: "Raden Werkudara", match: "Kendel Mbelani Bebener", category: "Tokoh", hint: "Ksatria Jodhipati gagah" },
      { id: "p6", term: "Krama Alus", match: "Basa Kanggo Ngurmati Wong Tuwa", category: "Unggah-Ungguh", hint: "Basa trapsila lan santun" },
    ];
  } else if (isGotongRoyong) {
    matchingPairs = [
      { id: "p1", term: "Berat Sama Dipikul", match: "Ringan Sama Dijinjing", category: "Pepatah", hint: "Falsafah gotong royong" },
      { id: "p2", term: "Piket Kelas", match: "Bekerja Sama Menjaga Kebersihan", category: "Sekolah", hint: "Tugas bersama tiap regu" },
      { id: "p3", term: "Kerja Bakti Warga", match: "Membersihkan Selokan Lingkungan", category: "Masyarakat", hint: "Dilakukan bersama tetangga" },
      { id: "p4", term: "Saling Menolong", match: "Tanpa Pamrih & Ikhlas", category: "Nilai Moral", hint: "Tidak mengharapkan upah" },
      { id: "p5", term: "Diskusi Kelompok", match: "Belajar Bersama Saling Membantu", category: "Belajar", hint: "Kawan yang paham membimbing" },
      { id: "p6", term: "Gotong Royong", match: "Warisan Budaya Luhur Nusantara", category: "Karakter", hint: "Tradisi pemersatu bangsa" },
    ];
  } else {
    matchingPairs = [
      { id: "p1", term: "⭐ Bintang Emas", match: "Sila Ke-1: Ketuhanan YME", category: "Simbol Sila", hint: "Cahaya ketakwaan & toleransi" },
      { id: "p2", term: "⛓️ Rantai Baja", match: "Sila Ke-2: Kemanusiaan Adil & Beradab", category: "Simbol Sila", hint: "Tali persaudaraan tolong menolong" },
      { id: "p3", term: "🌳 Pohon Beringin", match: "Sila Ke-3: Persatuan Indonesia", category: "Simbol Sila", hint: "Tempat berteduh keberagaman" },
      { id: "p4", term: "🐂 Kepala Banteng", match: "Sila Ke-4: Musyawarah Mufakat", category: "Simbol Sila", hint: "Kumpul bermusyawarah bijaksana" },
      { id: "p5", term: "🌾 Padi dan Kapas", match: "Sila Ke-5: Keadilan Sosial", category: "Simbol Sila", hint: "Kebutuhan pangan & sandang adil" },
      { id: "p6", term: "Bhinneka Tunggal Ika", match: "Berbeda-beda Tetap Satu Jua", category: "Semboyan", hint: "Kitab Kakawin Sutasoma Mpu Tantular" },
    ];
  }

  // 6. Data Tebak Kata Ceria (Word Scramble)
  let tebakKataChallenges: TebakKataChallenge[] = [];
  if (isJawa) {
    tebakKataChallenges = [
      {
        id: "w1",
        word: "PANDHAWA",
        scrambled: ["W", "A", "P", "D", "A", "A", "N", "H"],
        clue: "Sebutan kanggo sedulur lima putra Pandu kang nduweni watak luhur lan kesatria.",
        explanation: "Pandhawa Lima yaiku Puntadewa, Werkudara, Janaka, Nakula, lan Sadewa.",
        points: 20,
      },
      {
        id: "w2",
        word: "LEGENA",
        scrambled: ["G", "L", "E", "A", "E", "N"],
        clue: "Aksara Jawa dhasar kang durung diwenehi sandhangan swara apa-apa.",
        explanation: "Aksara Jawa Legena cacahe ana rong puluh (20) wiwit saka Ha nganti Nga.",
        points: 20,
      },
      {
        id: "w3",
        word: "TRAPSILA",
        scrambled: ["P", "T", "A", "R", "L", "S", "I", "A"],
        clue: "Tata krama, subasita, lan solah bawa kang becik nalika guneman karo wong liya.",
        explanation: "Trapsila nuduhake budi pekerti alus lan ngajeni wong tuwa.",
        points: 25,
      },
      {
        id: "w4",
        word: "SANTOSA",
        scrambled: ["T", "S", "N", "A", "O", "S", "A"],
        clue: "Unine bebasan: 'Rukun agawe ... , crah agawe bubrah'.",
        explanation: "Santosa tegese kuwat, tentrem, lan ora gampang dipecah belah.",
        points: 20,
      },
    ];
  } else if (isGotongRoyong) {
    tebakKataChallenges = [
      {
        id: "w1",
        word: "GOTONG",
        scrambled: ["T", "G", "O", "O", "N", "G"],
        clue: "Kata asal yang bermakna mengangkat atau memikul bersama-sama.",
        explanation: "Gotong royong adalah tradisi memikul pekerjaan bersama secara sukarela.",
        points: 20,
      },
      {
        id: "w2",
        word: "IKHLAS",
        scrambled: ["H", "I", "K", "L", "S", "A"],
        clue: "Sikap menolong orang lain dengan tulus tanpa mengharapkan balasan uang atau upah.",
        explanation: "Kerja sama yang ikhlas menciptakan keberkahan dan kebahagiaan.",
        points: 20,
      },
      {
        id: "w3",
        word: "PIKET",
        scrambled: ["T", "P", "I", "K", "E"],
        clue: "Kegiatan regu siswa membersihkan ruang kelas secara bergiliran setiap hari.",
        explanation: "Piket kelas melatih tanggung jawab bersama dan kedisiplinan sekolah.",
        points: 15,
      },
      {
        id: "w4",
        word: "EMPATI",
        scrambled: ["P", "E", "A", "M", "I", "T"],
        clue: "Kemampuan merasakan apa yang dialami orang lain dan tergerak untuk menolongnya.",
        explanation: "Empati sosial menghapuskan sifat egois dan mempererat persaudaraan.",
        points: 25,
      },
    ];
  } else {
    tebakKataChallenges = [
      {
        id: "w1",
        word: "BHINNEKA",
        scrambled: ["N", "B", "H", "I", "K", "E", "A", "N"],
        clue: "Kata pertama semboyan pemersatu bangsa Indonesia yang berarti 'berbeda-beda'.",
        explanation: "Bhinneka Tunggal Ika berasal dari Kitab Kakawin Sutasoma karangan Mpu Tantular.",
        points: 25,
      },
      {
        id: "w2",
        word: "GARUDA",
        scrambled: ["R", "G", "A", "D", "U", "A"],
        clue: "Burung mitologi emas lambang negara Republik Indonesia.",
        explanation: "Burung Garuda melambangkan keagungan dan kejayaan bangsa Indonesia.",
        points: 20,
      },
      {
        id: "w3",
        word: "TOLERANSI",
        scrambled: ["L", "T", "O", "R", "N", "E", "A", "S", "I"],
        clue: "Sikap saling menghormati dan menghargai perbedaan keyakinan serta budaya kawan.",
        explanation: "Toleransi adalah kunci utama kerukunan hidup berbangsa dan bernegara.",
        points: 25,
      },
      {
        id: "w4",
        word: "MUFAKAT",
        scrambled: ["F", "M", "U", "A", "T", "A", "K"],
        clue: "Hasil kesepakatan bulat yang dicapai melalui musyawarah bersama.",
        explanation: "Sila ke-4 Pancasila mengutamakan musyawarah untuk mencapai mufakat.",
        points: 20,
      },
    ];
  }

  // 7. Data Papan Ular Tangga Edukasi (30 Tiles)
  const ularTanggaLadders: Record<number, number> = {
    3: 11, // Tangga Sila 1 / Kebaikan
    8: 18, // Tangga Tolong Menolong
    15: 24, // Tangga Persatuan
  };

  const ularTanggaSnakes: Record<number, number> = {
    14: 6, // Rintangan Malas Belajar
    22: 12, // Rintangan Pertengkaran
    28: 17, // Rintangan Menyontek / Tidak Jujur
  };

  const ularTanggaQuizTiles: Record<number, UlarTanggaQuestion> = {
    5: {
      tileNumber: 5,
      question: isJawa
        ? "Basa apa kang paling trapsila dienggo matur karo bapak utawa ibu guru?"
        : "Saat teman berbeda suku sedang berbicara dengan logat daerahnya, sikap kita adalah:",
      options: isJawa
        ? ["Basa Ngoko Lugu", "Basa Krama Alus", "Basa Campuran"]
        : ["Mengejeknya", "Menghargai dan mendengarkan ramah", "Menjauhinya"],
      correctIndex: 1,
      explanation: isJawa
        ? "Krama Alus digunakake kanggo ngurmati wong kang luwih sepuh."
        : "Menghormati keragaman budaya adalah wujud persatuan Indonesia.",
    },
    10: {
      tileNumber: 10,
      question: isJawa
        ? "Aksara Jawa Legena (dhasar) kuwi cacahe ana pira?"
        : "Arti dari semboyan Bhinneka Tunggal Ika adalah:",
      options: isJawa
        ? ["10 Aksara", "20 Aksara", "30 Aksara"]
        : ["Satu untuk semua", "Berbeda-beda tetapi tetap satu jua", "Bersama kita teguh"],
      correctIndex: 1,
      explanation: isJawa
        ? "Aksara Jawa Legena cacahe ana 20 wiwit Ha nganti Nga."
        : "Bhinneka Tunggal Ika menyatukan ribuan pulau dan suku di Nusantara.",
    },
    16: {
      tileNumber: 16,
      question: isJawa
        ? "Sapa pembarepe Pandhawa Lima kang nduweni watak jujur lan sabar?"
        : "Perilaku yang mencerminkan gotong royong di lingkungan sekolah adalah:",
      options: isJawa
        ? ["Raden Puntadewa", "Raden Werkudara", "Raden Janaka"]
        : ["Mengerjakan piket kelas bersama-sama", "Makan sendiri di pojok kelas", "Meninggalkan sampah"],
      correctIndex: 0,
      explanation: isJawa
        ? "Puntadewa (Yudhistira) ora tau goroh lan luhur bebudene."
        : "Piket kelas bersama membuat pekerjaan berat menjadi ringan.",
    },
    23: {
      tileNumber: 23,
      question: isJawa
        ? "Sandhangan swara Suku manggone ing ngendi lan swarane dadi apa?"
        : "Pengambilan keputusan bersama dalam musyawarah sebaiknya bertujuan mencapai:",
      options: isJawa
        ? ["Ing dhuwur (swara i)", "Ing ngisor (swara u)", "Ing mburi (swara h)"]
        : ["Kemauan ketua kelas saja", "Mufakat untuk kebaikan bersama", "Pertengkaran yang seru"],
      correctIndex: 1,
      explanation: isJawa
        ? "Sandhangan Suku manggone ing ngisor aksara kanggo swara 'u'."
        : "Musyawarah mufakat menjunjung tinggi kebijaksanaan bersama.",
    },
    27: {
      tileNumber: 27,
      question: isJawa
        ? "Unine sesanti 'Rukun agawe santosa, crah agawe ... '?"
        : "Burung Garuda Pancasila mencengkeram pita putih yang bertuliskan:",
      options: isJawa
        ? ["Santosa", "Bubrah", "Mulya"]
        : ["Indonesia Raya", "Bhinneka Tunggal Ika", "Tut Wuri Handayani"],
      correctIndex: 1,
      explanation: isJawa
        ? "Crah agawe bubrah tegese yen congkrah bakal nemu karusakan."
        : "Pita Bhinneka Tunggal Ika diikat kokoh pada cakar Garuda Pancasila.",
    },
  };

  return {
    chapterId,
    chapterTitle,
    subject,
    recommendedMode,
    teacherExplanation: {
      summaryText: `Materi Pelajaran: ${chapterTitle}. Intisari ini dirancang khusus untuk memandu Penjelajah Muda memahami nilai-nilai luhur dan menerapkannya dalam kehidupan sehari-hari secara menyenangkan.`,
      voiceScript: teacherVoiceScript,
      points: pointsList,
    },
    gameGuides,
    adventureCheckpoints,
    matchingPairs,
    tebakKataChallenges,
    ularTangga: {
      totalTiles: 30,
      ladders: ularTanggaLadders,
      snakes: ularTanggaSnakes,
      quizTiles: ularTanggaQuizTiles,
    },
  };
}
