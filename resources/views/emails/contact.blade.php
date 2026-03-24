<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; color: #1f2937; line-height: 1.6; }
        .h { color: #C9A84C; font-size: 1.5rem; margin-bottom: 1rem; }
        .i { margin-bottom: 0.5rem; font-weight: 600; }
        .v { margin-bottom: 1.5rem; color: #4b5563; }
        .box { background: #f9fafb; padding: 2rem; border-radius: 8px; border: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="box">
        <h1 class="h">New Contact Inquiry</h1>
        
        <p class="i">Name:</p>
        <p class="v">{{ $data['name'] }}</p>
        
        <p class="i">Email:</p>
        <p class="v">{{ $data['email'] }}</p>
        
        <p class="i">Subject:</p>
        <p class="v">{{ $data['subject'] }}</p>
        
        <p class="i">Message:</p>
        <p class="v">{{ $data['message'] }}</p>
    </div>
</body>
</html>
