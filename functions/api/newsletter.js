// functions/api/newsletter.js

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1) Read form data
    const formData = await request.formData();
    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();

    // 2) Basic validation
    if (!email) {
      return new Response("Missing email", { status: 400 });
    }

    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailPattern.test(email)) {
      return new Response("Invalid email address", { status: 400 });
    }

    // 3) Ensure API key is present
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not defined in env");
      return new Response("Server configuration error.", { status: 500 });
    }

    // 4) Prepare Resend payload
    const payload = {
      from: "Aleks – The Daydreamverse <aleks@thedaydreamverse.blog>",
      to: ["aleks@thedaydreamverse.blog"],
      subject: "New Daydreamverse newsletter subscriber",
      text:
        `New subscriber for The Daydreamverse newsletter:\n\n` +
        `Name: ${name || "(not provided)"}\n` +
        `Email: ${email}\n`,
    };

    // 5) Call Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text().catch(() => "");
      console.error("Resend error", resendResponse.status, errorText);
      return new Response("Unable to send email right now.", { status: 502 });
    }

    // 6) Manual redirect (no Response.redirect() quirks)
    // This matches your static thank-you page path.
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/newsletter-thanks.html",
      },
    });
  } catch (err) {
    // Catch-all for any unexpected runtime errors so CF doesn't show 1101.
    console.error("Newsletter worker error:", err);
    return new Response("Something went wrong. Please try again later.", {
      status: 500,
    });
  }
}
