import { Resend } from "npm:resend@4.0.0";
import EdgeFunctionRequest from "./EdgeFunctionRequest.ts";

// Verify resend API key is present & create resend object
const resendApiKey = Deno.env.get("RESEND_API_KEY");
if (!resendApiKey) {
    console.error("RESEND_API_KEY environment variable is missing");
    throw new Error("RESEND_API_KEY environment variable is missing");
}

const resend = new Resend(resendApiKey as string);

/**
 * Sends an email to the desired address using Resend
 *
 * @param request EdgeFunctionRequest object for this invocation
 * @param email Email address to send to
 * @param subject Subject of the email
 * @param body Body of the email (can include HTML)
 */
const sendEmail = async (request: EdgeFunctionRequest, email: string, subject: string, body: string): Promise<void> => {

    if (!email || !subject || !body) {
        throw new Error(`sendEmail: Email, subject or body is missing. Email: ${email}, Subject: ${subject}, Body: ${body}`);
    }

    const response = await resend.emails.send({
        from: "OpenLMS <info@open-lms.ca>",
        to: email,
        replyTo: "queens.openlms@gmail.com",
        subject: subject,
        html: body
    });

    if (response.error) {
        throw new Error(`Error sending email to ${email}: ${response.error.message}`);
    }

    request.log(`Email sent successfully to ${email}`);
};

export { sendEmail };
