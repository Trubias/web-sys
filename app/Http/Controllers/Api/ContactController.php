<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Mail\ContactMail;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'subject' => 'nullable|string',
            'message' => 'required|string',
        ]);

        try {
            Mail::to('jayandkit.noreply@gmail.com')->send(new ContactMail($request->all()));
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            \Log::error('Contact Form Error: ' . $e->getMessage(), [
                'exception' => $e,
                'data' => $request->all()
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
