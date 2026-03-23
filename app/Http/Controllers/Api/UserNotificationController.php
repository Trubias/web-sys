<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class UserNotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = UserNotification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($notifications);
    }

    public function markAsRead(Request $request)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);
            
        return response()->json(['message' => 'All marked as read']);
    }

    public function markOneAsRead(Request $request, $id)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->update(['is_read' => true]);
            
        return response()->json(['message' => 'Marked as read']);
    }

    public function destroyAll(Request $request)
    {
        UserNotification::where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'All notifications cleared']);
    }
}
