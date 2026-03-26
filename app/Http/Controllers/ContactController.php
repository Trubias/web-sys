<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Mail\ContactMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'subject' => 'required|string',
            'message' => 'required|string',
        ]);

        try {
            \Mail::raw("Name: {$request->name}\nEmail: {$request->email}\nSubject: {$request->subject}\n\nMessage:\n{$request->message}", function ($mail) use ($request) {
                $mail->to('jayandkit.noreply@gmail.com')
                     ->replyTo($request->email, $request->name)
                     ->subject($request->subject);
            });

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
