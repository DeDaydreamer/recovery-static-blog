// functions/api/newsletter.js
export async function onRequestPost(context) {
  const { request, env } = context;

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

  // Prepare Resend payload
  const payload = {
    from: "Aleks – The Daydreamverse <aleks@thedaydreamverse.blog>",
    to: ["aleks@thedaydreamverse.blog"],
    subject: "New Daydreamverse newsletter subscriber",
    text:
      `New subscriber for The Daydreamverse newsletter:\n\n` +
      `Name: ${name || "(not provided)"}\n` +
      `Email: ${email}\n`
  };

  // Call Resend API
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    console.error("Resend error", resendResponse.status, errorText);
    return new Response("Unable to send email right now.", { status: 500 });
  }

  // Redirect to thank-you page (relative URL)
  return Response.redirect("/newsletter-thanks.html", 303);
}
