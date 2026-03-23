<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;

class AdminUserController extends Controller
{
    public function index()
    {
        // Only fetch users who are registered as regular customers
        return response()->json(User::where('role', 'user')->get());
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete(); // Soft Delete
        return response()->json(['message' => 'User safely soft deleted']);
    }
}
