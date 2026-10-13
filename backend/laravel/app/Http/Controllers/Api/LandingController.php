<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class LandingController extends Controller
{
    /**
     * GET /api/v1/landing/stats (FR-00 Statistik Publik Landing Page)
     */
    public function getStats()
    {
        return response()->json([
            'success' => true,
            'message' => 'Statistik publik berhasil dimuat.',
            'data'    => [
                'total_modules'        => 4,
                'total_students'       => 50,
                'average_satisfaction' => 98.4,
                'total_coins_rewarded' => 1420,
                'featured_chapters'    => [
                    ['id' => 'pkn-sila3', 'title' => 'PKn: Makna Sila Ke-3 Pancasila'],
                    ['id' => 'bjawa-unggahungguh', 'title' => 'B. Jawa: Unggah-ungguh Basa'],
                ]
            ]
        ]);
    }
}
