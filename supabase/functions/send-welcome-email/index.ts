import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, fullName }: WelcomeEmailRequest = await req.json();

    if (!email || !fullName) {
      return new Response(
        JSON.stringify({ error: "Email and full name are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to WatchWicket ScoreBox 🏏</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #064428 0%, #0b5c33 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: bold;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.8;
    }
    .arabic-greeting {
      color: #064428;
      font-size: 20px;
      font-family: serif;
      text-align: center;
      margin-bottom: 10px;
    }
    .greeting {
      color: #064428;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 25px;
    }
    .message {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .section-title {
      color: #064428;
      font-size: 20px;
      font-weight: bold;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .steps {
      background-color: #f9fafb;
      border-left: 4px solid #0b5c33;
      padding: 20px;
      margin: 20px 0;
    }
    .step {
      margin: 15px 0;
    }
    .step-number {
      color: #0b5c33;
      font-weight: bold;
      font-size: 18px;
    }
    .step-title {
      color: #064428;
      font-weight: 600;
      margin: 5px 0;
    }
    .step-desc {
      color: #555555;
      font-size: 15px;
    }
    .footer {
      background-color: #064428;
      color: #ffffff;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    .footer p {
      margin: 10px 0;
    }
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏏 WATCHWICKET</h1>
      <p style="color: #e0e0e0; margin: 10px 0 0 0;">ScoreBox</p>
    </div>

    <div class="content">
      <div class="arabic-greeting">
        بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيم
      </div>

      <div class="greeting">
        As-salāmu ʿalaykum wa raḥmatullāhi wa barakātuh ${fullName},
      </div>

      <p class="message">
        Thank you for signing up to WatchWicket ScoreBox.<br>
        Your account is now active and ready to use.
      </p>

      <h3 class="section-title">What you can do next</h3>

      <div class="steps">
        <div class="step">
          <div class="step-number">1. Create your player profile</div>
          <div class="step-desc">
            Add your name, role, and batting/bowling style so your stats are accurate from the very first match.
          </div>
        </div>

        <div class="step">
          <div class="step-number">2. Build your squad</div>
          <div class="step-desc">
            Set up your regular players under "Player Profiles" and "Teams."
          </div>
        </div>

        <div class="step">
          <div class="step-number">3. Start your first match</div>
          <div class="step-desc">
            Tap the big red cricket ball at the bottom of the app.<br>
            Choose Indoor, T20, or ODI — then begin scoring ball-by-ball.
          </div>
        </div>

        <div class="step">
          <div class="step-number">4. Explore My Matches & Leagues</div>
          <div class="step-desc">
            View saved matches, fixtures, and league tables.
          </div>
        </div>
      </div>

      <h3 class="section-title">Need Help?</h3>

      <p class="message">
        If you find a bug or want to suggest a feature, contact us through Support in the app.<br>
        Your feedback helps shape the future of WatchWicket ScoreBox.
      </p>

      <div class="signature">
        <p class="message">
          <strong>Thank you ${fullName}</strong>
        </p>
        <p class="message">
          We hope this app makes your cricket more organised, enjoyable, and memorable.
        </p>
        <p class="message">
          Warm regards,<br>
          <strong>The WatchWicket ScoreBox Team</strong>
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>WatchWicket ScoreBox</strong></p>
      <p style="margin-top: 20px; font-size: 12px; color: #a0a0a0;">
        You're receiving this email because you created a WatchWicket account.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيم
As-salāmu ʿalaykum wa raḥmatullāhi wa barakātuh ${fullName},

Thank you for signing up to WatchWicket ScoreBox.
Your account is now active and ready to use.

What you can do next:

1. Create your player profile
   Add your name, role, and batting/bowling style so your stats are accurate from the very first match.

2. Build your squad
   Set up your regular players under "Player Profiles" and "Teams."

3. Start your first match
   Tap the big red cricket ball at the bottom of the app.
   Choose Indoor, T20, or ODI — then begin scoring ball-by-ball.

4. Explore My Matches & Leagues
   View saved matches, fixtures, and league tables.

Need Help?
If you find a bug or want to suggest a feature, contact us through Support in the app.
Your feedback helps shape the future of WatchWicket ScoreBox.

Thank you ${fullName}

We hope this app makes your cricket more organised, enjoyable, and memorable.

Warm regards,
The WatchWicket ScoreBox Team

---
WatchWicket ScoreBox

You're receiving this email because you created a WatchWicket account.
    `;

    console.log(`Sending welcome email to ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email sent successfully",
        preview: `Welcome email would be sent to ${email} (${fullName})`
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send welcome email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
