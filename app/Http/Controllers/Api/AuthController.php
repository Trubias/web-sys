<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Admin;
use App\Models\Supplier;
use App\Models\Rider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email|unique:admins,email|unique:suppliers,email|unique:riders,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'in:user,supplier,rider',
            'phone' => 'nullable|string|max:20',
            'address' => ($request->role === 'user' || empty($request->role)) ? 'required|string|max:500' : 'nullable|string|max:500',
            'brands' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'government_id' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ]);
        $role = $request->role ?? 'user';
        $user = null;

        if ($role === 'supplier') {
            $user = Supplier::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'supplier',
                'phone' => $request->phone,
                'address' => $request->address,
                'brands' => $request->brands,
            ]);
        }
        else if ($role === 'rider') {
            $riderData = [
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'rider',
                'phone' => $request->phone,
                'vehicle_type' => $request->vehicle ?? $request->vehicle_type,
                'region' => $request->region,
                'city' => $request->city,
                'rider_status' => $request->status ?? 'pending',
            ];

            if ($request->hasFile('government_id')) {
                $path = $request->file('government_id')->store('government_ids', 'public');
                $riderData['government_id'] = '/storage/' . $path;
            }

            $user = Rider::create($riderData);
        }
        else {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'user',
                'phone' => $request->phone,
                'address' => $request->address,
                'region' => $request->region,
                'city' => $request->city,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json(['user' => $user, 'token' => $token, 'message' => 'Registration successful'], 201);
    }

    public function login(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required']);

        $user = User::where('email', $request->email)->first()
            ?: Admin::where('email', $request->email)->first()
            ?: Supplier::where('email', $request->email)->first()
            ?: Rider::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages(['email' => ['The provided credentials are incorrect.']]);
        }

        if ($request->has('login_type')) {
            if ($request->login_type === 'rider' && $user->role !== 'rider') {
                return response()->json(['message' => 'This account is not a Rider account. Please login at the Customer login page.'], 422);
            }
            if ($request->login_type === 'user' && $user->role === 'rider') {
                return response()->json(['message' => 'This account is a Rider account. Please login at the Rider login page.'], 422);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json(['user' => $user, 'token' => $token, 'message' => 'Login successful']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Update the supplier's own profile (text fields).
     * Year Established and Registration No. are intentionally excluded.
     */
    public function updateSupplierProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'    => 'sometimes|string|max:255',
            'brands'  => 'sometimes|nullable|string|max:500',
            'phone'   => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:500',
        ]);

        $user->update($validated);

        return response()->json($user->fresh());
    }

    /**
     * POST /api/supplier/logo
     * Upload or replace the supplier's profile logo.
     */
    public function uploadSupplierLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:3072',
        ]);

        $user = $request->user();

        // Delete old logo if it exists
        if ($user->logo) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $user->logo));
        }

        $path = $request->file('logo')->store('supplier_logos', 'public');
        $user->update(['logo' => '/storage/' . $path]);

        return response()->json($user->fresh());
    }

    /**
     * DELETE /api/supplier/logo
     * Remove the supplier's profile avatar and revert to initials.
     */
    public function removeSupplierLogo(Request $request)
    {
        $user = $request->user();

        if ($user->logo) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $user->logo));
            $user->update(['logo' => null]);
        }

        return response()->json($user->fresh());
    }


    /**
     * Update the standard user's profile.
     */
    public function updateUserProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:500',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'region' => 'sometimes|nullable|string|max:255',
            'city' => 'sometimes|nullable|string|max:255',
        ]);

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                // Remove '/storage/' from the stored path to delete correctly
                Storage::disk('public')->delete(str_replace('/storage/', '', $user->avatar));
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = '/storage/' . $path;
        }

        $user->update($validated);

        return response()->json($user->fresh());
    }
}
