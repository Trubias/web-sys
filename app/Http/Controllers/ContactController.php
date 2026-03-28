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

            $apiKey = env('BREVO_API_KEY');

            $response = Http::withHeaders([
                'api-key' => $apiKey,
                'accept' => 'application/json',
                'content-type' => 'application/json',
            ])->post('https://api.brevo.com/v3/smtp/email', [
                'sender' => [
                    'name' => 'J&K Watch',
                    'email' => 'jayandkit.noreply@gmail.com'
                ],
                'to' => [
                    [
                        'email' => 'jayandkit.noreply@gmail.com',
                        'name' => 'J&K Watch Admin'
                    ]
                ],
                'replyTo' => [
                    'email' => $request->email,
                    'name'  => $request->name,
                ],
                'subject' => 'New Contact Message: ' . $request->subject,
                'htmlContent' => '
                    <h3>New Contact Message from J&K Watch Website</h3>
                    <p><b>Name:</b> ' . $request->name . '</p>
                    <p><b>Email:</b> ' . $request->email . '</p>
                    <p><b>Subject:</b> ' . $request->subject . '</p>
                    <p><b>Message:</b> ' . $request->message . '</p>
                '
            ]);

            if ($response->failed()) {
                \Log::error('Brevo error: ' . $response->body());
                return response()->json([
                    'message' => 'Failed: ' . $response->body()
                ], 500);
            }

            return response()->json(['message' => 'Message sent successfully']);

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
