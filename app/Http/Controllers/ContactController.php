<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

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

            $textContent =
                "New contact form submission\n" .
                str_repeat('-', 40) . "\n" .
                "Name:    {$name}\n" .
                "Email:   {$email}\n" .
                "Subject: {$subject}\n\n" .
                "Message:\n{$body}";

            $response = Http::withHeaders([
                'api-key'      => env('BREVO_API_KEY'),
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ])->post('https://api.brevo.com/v3/smtp/email', [
                'sender' => [
                    'name'  => 'J&K Watch',
                    'email' => 'a5e76f001@smtp-brevo.com',
                ],
                'to' => [
                    ['email' => $to, 'name' => 'J&K Watch'],
                ],
                'replyTo' => [
                    'email' => $email,
                    'name'  => $name,
                ],
                'subject'     => '[Contact] ' . $subject,
                'textContent' => $textContent,
            ]);

            if ($response->failed()) {
                $err = $response->json('message') ?? $response->body();
                Log::error('Contact Form Brevo API Error: ' . $err);
                return response()->json(['error' => $err], 500);
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Contact Form Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
