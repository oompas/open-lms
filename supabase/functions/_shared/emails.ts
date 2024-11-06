import { Resend } from "npm:resend";
import { log } from "./helpers.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const sendEmail = async (email: string, subject: string, body: string): Promise<void> => {

    if (!email || !subject || !body) {
        log(`sendEmail: Email, subject or body is missing: ${subject}, ${body}`);
        throw new Error(`sendEmail: Email, subject or body is missing`);
    }

    try {
        const { error } = await resend.emails.send({
            from: "OpenLMS <info@open-lms.ca>",
            to: email,
            subject: subject,
            text: body
        });

        if (error) {
            log(`Error sending email to ${email}: ${error.message}`);
            throw new Error(`Error sending email: ${error.message}`);
        }

        log(`Email sent successfully to ${email}`);
    } catch (err) {
        log(`Failed to send email due to an unexpected error: ${err.message}`);
        throw new Error(`Failed to send email: ${err.message}`);
    }
};

export { sendEmail };
