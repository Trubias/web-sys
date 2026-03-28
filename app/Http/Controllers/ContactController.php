<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

use App\Models\Admin;
use Exception;

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
            $name    = $validated['name'];
            $email   = $validated['email'];
            $subject = $validated['subject'];
            $body    = $validated['message'];

            $textContent =
                "New contact form submission\n" .
                str_repeat('-', 40) . "\n" .
                "Sender's Full Name:    {$name}\n" .
                "Sender's Email Address:   {$email}\n" .
                "Subject selected: {$subject}\n\n" .
                "Message content:\n{$body}";

            config([
                'mail.mailers.smtp.host' => env('MAIL_HOST'),
                'mail.mailers.smtp.port' => env('MAIL_PORT'),
                'mail.mailers.smtp.username' => env('MAIL_USERNAME'),
                'mail.mailers.smtp.password' => env('MAIL_PASSWORD'),
                'mail.mailers.smtp.encryption' => env('MAIL_ENCRYPTION'),
                'mail.from.address' => env('MAIL_FROM_ADDRESS'),
                'mail.from.name' => env('MAIL_FROM_NAME'),
            ]);

            \Illuminate\Support\Facades\Mail::raw($textContent, function($m) use ($name, $email, $subject) {
                $m->to('krickjay2000@gmail.com')
                  ->replyTo($email, $name)
                  ->subject('[Contact] ' . $subject);
            });

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Contact Form Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to send message. Please try again later. Details: ' . $e->getMessage(),
            ], 500);
        }
    }
}
