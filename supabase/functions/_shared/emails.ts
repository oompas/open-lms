import { Resend } from "npm:resend";
import { log } from "./helpers.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const sendEmail = async (email: string, subject: string, body: string) => {
    const { error } = await resend.emails.send({
        from: "OpenLMS Team",
        to: email,
        subject: subject,
        text: body
    });

    if (error) {
        log(`Error sending email: ${error.message}`);
        throw new Error(`Error sending email: ${error.message}`);
    }
}

export { sendEmail };
