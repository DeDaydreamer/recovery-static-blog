// functions/api/newsletter.js
export async function onRequestPost(context) {
  const { request } = context;

  // Read form data
  const formData = await request.formData();
  const name = (formData.get("name") || "").toString().trim();
  const email = (formData.get("email") || "").toString().trim();

  if (!email) {
    return new Response("Missing email", { status: 400 });
  }

  // Very simple email validation
  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailPattern.test(email)) {
    return new Response("Invalid email address", { status: 400 });
  }

  // Prepare MailChannels payload
  const body = {
    personalizations: [
      {
        to: [{ email: "aleks@thedaydreamverse.blog", name: "Aleks" }],
        subject: "New Daydreamverse newsletter subscriber"
      }
    ],
    from: {
      email: "aleks@thedaydreamverse.blog",
      name: "Aleks – The Daydreamverse Blog"
    },
    content: [
      {
        type: "text/plain",
        value:
          `New subscriber for The Daydreamverse newsletter:\n\n` +
          `Name: ${name || "(not provided)"}\n` +
          `Email: ${email}\n`
      }
    ]
  };

  // Send via MailChannels (Cloudflare-integrated)
  const mcResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!mcResponse.ok) {
    console.error("MailChannels error", mcResponse.status, await mcResponse.text());
    return new Response("Unable to send email right now.", { status: 500 });
  }

  // Redirect to thank-you page
  return Response.redirect(
    "https://www.thedaydreamverse.blog/newsletter-thanks.html",
    303
  );
}
