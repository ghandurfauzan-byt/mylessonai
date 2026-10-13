<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CurriculumController extends Controller
{
    /**
     * GET /api/v1/curriculum/catalog (Katalog Buku Resmi Kemdikbud SIBI & Disdik Mulok)
     */
    public function catalog()
    {
        return response()->json([
            'success' => true,
            'message' => 'Katalog kurikulum resmi berhasil dimuat.',
            'data'    => [
                [
                    'id'            => 'buku-pkn-sd4',
                    'title'         => 'Buku Panduan Guru & Siswa Pendidikan Pancasila SD Kelas IV',
                    'publisher'     => 'Pusat Perbukuan BSKAP Kemdikbudristek RI',
                    'subject'       => 'pkn',
                    'grade'         => 'Kelas 4 SD (Fase B)',
                    'source'        => 'API SIBI Kemdikbudristek (Terbuka & Gratis)',
                    'chaptersCount' => 4,
                    'pdfUrl'        => 'https://buku.kemdikbud.go.id/katalog/buku-teks/pancasila-sd-4.pdf',
                ],
                [
                    'id'            => 'buku-bjawa-sd4',
                    'title'         => 'Wursita Basa: Piwulang Basa Jawa SD/MI Kelas IV',
                    'publisher'     => 'Dinas Pendidikan & Kebudayaan Provinsi (Mulok Daerah)',
                    'subject'       => 'bjawa',
                    'grade'         => 'Kelas 4 SD (Fase B)',
                    'source'        => 'Repositori Mulok Daerah Disdikbud (Terbuka & Gratis)',
                    'chaptersCount' => 4,
                    'pdfUrl'        => 'https://disdik.jatengprov.go.id/mulok/wursita-basa-kelas4.pdf',
                ],
            ]
        ]);
    }

    /**
     * POST /api/v1/curriculum/request (Tarik & Generate Modul Adaptif dari AI / Kemdikbud)
     */
    public function requestModule(Request $request)
    {
        $request->validate([
            'topicTitle' => 'required|string|max:200',
        ]);

        $subject     = $request->input('subject', 'pkn');
        $chapterCode = $request->input('chapterCode', 'Bab Baru');
        $topicTitle  = $request->input('topicTitle');
        $goal        = $request->input('learningGoal', 'Peserta didik memahami konsep esensial materi.');
        $apiSource   = $request->input('apiSource', 'kemdikbud');

        $isPkn = $subject === 'pkn';

        $generatedModule = [
            'id'                   => 'mod-' . $subject . '-' . time(),
            'subject'              => $subject,
            'subjectLabel'         => $isPkn ? 'Pendidikan Pancasila & PKn' : 'Basa Jawa (Muatan Lokal)',
            'grade'                => 'Kelas 4 SD (Fase B)',
            'title'                => trim($topicTitle),
            'chapterCode'          => trim($chapterCode),
            'source'               => $apiSource === 'disdik'
                ? 'Repositori Mulok Disdikbud Provinsi (Buku Ajar Resmi)'
                : 'API SIBI Kemdikbudristek RI (Buku Teks Kurikulum Merdeka)',
            'sourceType'           => $apiSource,
            'pageCount'            => 24,
            'learningGoal'         => trim($goal),
            'isValidated'          => false,
            'isActiveToday'        => false,
            'ragSummary'           => [
                "📌 Intisari Materi: Pembelajaran {$chapterCode} mengenai \"{$topicTitle}\" disarikan ke dalam konsep budi pekerti ramah anak.",
                "🏫 Pengamalan di Sekolah: Mengajak siswa bekerja sama dengan teman sebaya tanpa membeda-bedakan latar belakang.",
                "🏡 Pengamalan di Rumah: Membiasakan sikap santun, menghormati orang tua dan anggota keluarga.",
            ],
            'generatedQuizPreview' => [
                "Level 1 (Mudah): Pemahaman istilah dasar dan makna penting (+10 Koin)",
                "Level 2 (Sedang): Penerapan contoh sikap yang terpuji di lingkungan sekolah (+20 Koin)",
                "Level 3 (Tantangan): Analisis situasi bagaimana bersikap adil dan rukun (+30 Koin)",
            ],
        ];

        $apiKey = env('GEMINI_API_KEY');
        $aiEngine = 'Template Adaptif Cerdas';

        if (!empty($apiKey) && $apiKey !== 'tempel_api_key_gemini_anda_disini') {
            try {
                $prompt = "Anda adalah asisten kurikulum SD fase B kurikulum merdeka (" . ($isPkn ? "PKn" : "Basa Jawa") . "). Buatkan ringkasan aksi nyata budi pekerti dan kuis untuk topik: \"{$topicTitle}\" ({$chapterCode}). Format JSON: {\"ragSummary\": [\"...\"], \"quizPreview\": [\"...\"]}";
                $response = \Illuminate\Support\Facades\Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => ['responseMimeType' => 'application/json']
                ]);

                if ($response->successful()) {
                    $json = json_decode($response->json('candidates.0.content.parts.0.text'), true);
                    if (!empty($json['ragSummary'])) $generatedModule['ragSummary'] = $json['ragSummary'];
                    if (!empty($json['quizPreview'])) $generatedModule['generatedQuizPreview'] = $json['quizPreview'];
                    $aiEngine = 'Google Gemini 1.5 Flash (API Asli)';
                }
            } catch (\Exception $e) {
                // Fallback otomatis ke template
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Materi berhasil ditarik dan disintesis oleh mesin {$aiEngine}.",
            'engine'  => $aiEngine,
            'data'    => $generatedModule,
        ]);
    }

    /**
     * POST /api/v1/curriculum/validate (Pengesahan Guru & Terbitkan ke Siswa)
     */
    public function validateModule(Request $request)
    {
        $moduleData = $request->all();

        return response()->json([
            'success' => true,
            'message' => 'Modul resmi divalidasi oleh Guru dan telah aktif di Ruang Belajar Siswa.',
            'data'    => array_merge($moduleData, [
                'isValidated'   => true,
                'isActiveToday' => true,
                'validatedAt'   => 'Baru saja divalidasi',
            ]),
        ]);
    }
}
