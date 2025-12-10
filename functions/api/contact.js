// functions/api/contact.js

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();

    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const subject = (formData.get("subject") || "").toString().trim();
    const message = (formData.get("message") || "").toString().trim();
    const website = (formData.get("website") || "").toString().trim(); // honeypot

    // Honeypot spam check
    if (website) {
      // Bot likely filled this in, pretend success but do nothing
      return new Response(null, {
        status: 303,
        headers: { Location: "/contact-thanks.html" },
      });
    }

    if (!email) {
      return new Response("Missing email", { status: 400 });
    }

    // Simple email validation
    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailPattern.test(email)) {
      return new Response("Invalid email address", { status: 400 });
    }

    if (!message) {
      return new Response("Message cannot be empty", { status: 400 });
    }

    // Optional: prevent absurdly long messages
    if (message.length > 5000) {
      return new Response("Message is too long", { status: 400 });
    }

    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not defined in env");
      return new Response("Server configuration error.", { status: 500 });
    }

    const emailSubject =
      subject ||
      `New contact form message from ${name || "Daydreamverse visitor"}`;

    const textBody =
      `New contact form message from The Daydreamverse Blog:\n\n` +
      `Name: ${name || "(not provided)"}\n` +
      `Email: ${email}\n` +
      `Subject: ${subject || "(not provided)"}\n\n` +
      `Message:\n${message}\n`;

    const payload = {
      from: "Contact – The Daydreamverse <contact@thedaydreamverse.blog>",
      to: ["aleks@thedaydreamverse.blog"],
      subject: emailSubject,
      text: textBody,
    };

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
      console.error("Resend contact error", resendResponse.status, errorText);
      return new Response("Unable to send message right now.", {
        status: 502,
      });
    }

    // Redirect to a simple thank-you page
    return new Response(null, {
      status: 303,
      headers: { Location: "/contact-thanks.html" },
    });
  } catch (err) {
    console.error("Contact form worker error:", err);
    return new Response("Something went wrong. Please try again later.", {
      status: 500,
    });
  }
}
