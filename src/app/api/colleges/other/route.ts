import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { publicRoute } from "~/auth/route-handlers";
import { createCollegeRequest } from "~/db/services/college-requests";
import { rateLimiters } from "~/lib/rate-limit";

export const POST = publicRoute(async (req: NextRequest) => {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  try {
    const body = await req.json();
    const { customCollegeName, participantData } = body;

    if (!customCollegeName) {
      return NextResponse.json(
        { message: "Custom college name is required." },
        { status: 400 },
      );
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
      from: SMTP_USER || '"Hackfest Registration" <noreply@hackfest.dev>',
      to: "finiteloopclub@nmamit.in",
      cc: "tech@hackfest.dev, nnm23cs144@nmamit.in",
      subject: `New College Request: ${customCollegeName}`,
      html: `
        <h2>New College Addition Request</h2>
        <p>A participant has requested to add a new college that was not in the list.</p>

        <h3>Requested College</h3>
        <p><strong>Name:</strong> ${customCollegeName}</p>

        <h3>Participant Information (So Far)</h3>
        <pre>${JSON.stringify(participantData, null, 2)}</pre>

        <hr />
        <p>Please add this college to the database if valid, and contact the participant to continue their registration.</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error(
        "Failed to send email (likely due to missing SMTP credentials), but proceeding:",
        emailError,
      );
    }

    // Save to database
    try {
      await createCollegeRequest(customCollegeName, participantData.state);
    } catch (dbError) {
      console.error("Failed to insert college request into database:", dbError);
      // We can choose to fail or succeed here. Assuming we still want to succeed if email sent,
      // but ideally we want database to be primary Source of Truth now.
      return NextResponse.json(
        { message: "Failed to save college request." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "College request sent successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in college request:", error);
    return NextResponse.json(
      { message: "Failed to process the request." },
      { status: 500 },
    );
  }
}, rateLimiters.email);
