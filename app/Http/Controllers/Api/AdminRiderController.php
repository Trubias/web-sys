<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use Illuminate\Http\Request;

class AdminRiderController extends Controller
{
    public function index()
    {
        return response()->json(Rider::all());
    }

    public function setInterview(Request $request, $id)
    {
        $request->validate(['interview_date' => 'required|date']);
        $rider = Rider::findOrFail($id);

        $rider->update([
            'rider_status' => 'interview_scheduled',
            'interview_date' => $request->interview_date
        ]);

        return response()->json(['message' => 'Interview scheduled', 'rider' => $rider]);
    }

    public function confirm($id)
    {
        $rider = Rider::findOrFail($id);
        $rider->update(['rider_status' => 'active']);

        return response()->json(['message' => 'Rider confirmed', 'rider' => $rider]);
    }

    public function destroy($id)
    {
        $rider = Rider::findOrFail($id);
        $rider->delete(); // Soft Delete
        return response()->json(['message' => 'Rider safely soft deleted']);
    }
}
