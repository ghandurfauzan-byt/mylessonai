<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/register (FR-01 Registrasi Akun Mandiri)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:100',
            'email'    => 'required|string|email|max:150|unique:users',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:pelajar,pengajar',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password), // Bcrypt Hash 10 rounds
            'role'     => $request->role,
            'points'   => 0,
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'Akun berhasil didaftarkan.',
            'data'    => [
                'user'       => $user,
                'token'      => $token,
                'token_type' => 'Bearer',
                'expires_in' => config('jwt.ttl', 1440) * 60,
            ]
        ], 201);
    }

    /**
     * POST /api/v1/auth/login (FR-02 Login Reguler & 1-Click Quick Demo)
     */
    public function login(Request $request)
    {
        // 1. Dukungan 1-Click Quick Demo Login
        if ($request->has('role') && !$request->has('email')) {
            $role = $request->role;
            $demoEmail = $role === 'pengajar' ? 'darmawan@gmail.com' : 'ghandur@gmail.com';
            
            $user = User::firstOrCreate(
                ['email' => $demoEmail],
                [
                    'name'     => $role === 'pengajar' ? 'Bpk. Darmawan (Guru)' : 'Ghandur Fauzan (Siswa)',
                    'password' => Hash::make('secret123'),
                    'role'     => $role,
                    'points'   => 120,
                ]
            );

            $token = JWTAuth::fromUser($user);

            return response()->json([
                'success' => true,
                'message' => 'Login demo berhasil.',
                'data'    => [
                    'user'       => $user,
                    'role'       => $user->role,
                    'token'      => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => 86400,
                ]
            ]);
        }

        // 2. Login Reguler dengan Email & Kata Sandi
        $credentials = $request->only('email', 'password');
        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau kata sandi tidak cocok.'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data'    => [
                'user'       => auth()->user(),
                'role'       => auth()->user()->role,
                'token'      => $token,
                'token_type' => 'Bearer',
                'expires_in' => 86400,
            ]
        ]);
    }

    /**
     * GET /api/v1/auth/session (FR-03 Verifikasi Sesi Aktif)
     */
    public function session()
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'authenticated' => true,
                'user'          => auth()->user(),
                'role'          => auth()->user()->role,
            ]
        ]);
    }

    /**
     * POST /api/v1/auth/logout (FR-03 Logout Sesi)
     */
    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil. Sesi telah diakhiri.'
        ]);
    }
}
