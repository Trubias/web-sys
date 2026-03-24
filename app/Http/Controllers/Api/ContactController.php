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
            Mail::to('jayandkit.noreply@gmail.com')->send(new ContactFormMail($request->all()));
            return response()->json(['message' => 'Email sent successfully!']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send email. ' . $e->getMessage()], 500);
        }
    }
}
