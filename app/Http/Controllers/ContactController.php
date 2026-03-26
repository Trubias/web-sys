<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function send(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        try {
            $to      = 'jayandkit.noreply@gmail.com';
            $name    = $validated['name'];
            $email   = $validated['email'];
            $subject = $validated['subject'];
            $body    = $validated['message'];

            Mail::send([], [], function ($msg) use ($to, $name, $email, $subject, $body) {
                $msg->to($to, 'J&K Watch')
                    ->replyTo($email, $name)
                    ->subject('[Contact] ' . $subject)
                    ->text(implode("\n", [
                        'New contact form submission',
                        str_repeat('-', 40),
                        'Name:    ' . $name,
                        'Email:   ' . $email,
                        'Subject: ' . $subject,
                        '',
                        'Message:',
                        $body,
                    ]));
            });

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Contact Form Mail Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error'   => 'Failed to send email. Please try again later.',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
