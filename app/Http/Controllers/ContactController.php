<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $apiKey = env('BREVO_API_KEY');

        if (empty($apiKey)) {
            Log::error('Contact Form: BREVO_API_KEY is not set.');
            return response()->json(['error' => 'Mail service is not configured. Please contact the administrator.'], 500);
        }

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'api-key'      => $apiKey,
                    'Content-Type' => 'application/json',
                    'Accept'       => 'application/json',
                ])
                ->post('https://api.brevo.com/v3/smtp/email', [
                    'sender' => [
                        'name'  => 'J&K Watch Contact Form',
                        'email' => 'a5e76f001@smtp-brevo.com',
                    ],
                    'to' => [
                        ['email' => 'jayandkit.noreply@gmail.com', 'name' => 'J&K Watch'],
                    ],
                    'replyTo' => [
                        'email' => $request->email,
                        'name'  => $request->name,
                    ],
                    'subject'     => '[Contact] ' . $request->subject,
                    'textContent' => implode("\n", [
                        'New contact form submission:',
                        '',
                        'Name:    ' . $request->name,
                        'Email:   ' . $request->email,
                        'Subject: ' . $request->subject,
                        '',
                        'Message:',
                        $request->message,
                    ]),
                ]);

            if ($response->successful()) {
                return response()->json(['success' => true]);
            }

            Log::error('Brevo API error: ' . $response->status(), [
                'body' => $response->body(),
            ]);

            return response()->json([
                'error' => 'Email service returned an error (' . $response->status() . '). Please try again.'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Contact Form Exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => 'Failed to send email. Please try again later.'
            ], 500);
        }
    }
}
