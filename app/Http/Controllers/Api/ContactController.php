<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Mail\ContactFormMail;
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
            Mail::send(new ContactFormMail($request->all()));
            return response()->json(['message' => 'Email sent successfully!']);
        } catch (\Exception $e) {
            \Log::error('Contact Form Error: ' . $e->getMessage(), [
                'exception' => $e,
                'data' => $request->all()
            ]);
            return response()->json([
                'message' => 'Something went wrong. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
