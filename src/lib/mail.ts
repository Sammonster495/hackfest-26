import nodemailer from "nodemailer";

export async function sendAdminPaymentEmail({
  teamName,
  teamId,
  leaderName,
  paymentScreenshotUrl,
}: {
  teamName: string;
  teamId: string;
  leaderName: string;
  paymentScreenshotUrl: string;
}) {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("Missing SMTP credentials. Cannot send admin payment email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const mailOptions = {
    from: SMTP_USER || '"Hackfest Payments" <noreply@hackfest.dev>',
    to: "bn2345890@gmail.com",
    cc: "tech@hackfest.dev",
    subject: `New Event Payment Submission: ${teamName}`,
    html: `
      <h2>New Event Payment Submission</h2>
      <p>A new payment proof has been submitted by a team for event registration.</p>

      <h3>Payment Details</h3>
      <ul>
        <li><strong>Team Name:</strong> ${teamName}</li>
        <li><strong>Team ID:</strong> ${teamId}</li>
        <li><strong>Leader Name:</strong> ${leaderName}</li>
      </ul>

      <h3>Screenshot</h3>
      <p>You can view the payment screenshot below or by clicking <a href="${paymentScreenshotUrl}">here</a>.</p>
      <img src="${paymentScreenshotUrl}" alt="Payment Screenshot" style="max-width: 600px; height: auto; border: 1px solid #ccc; margin-top: 10px;" />
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Admin payment notification email sent successfully for team:", teamName);
  } catch (emailError) {
    console.error("Failed to send payment email to admin:", emailError);
  }
}
