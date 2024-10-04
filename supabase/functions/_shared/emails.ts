import { Resend } from "npm:resend";
import { InternalError, log } from "./helpers.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const sendEmail = (email: string, subject: string, body: string) => {
    const { error } = await resend.emails.send({
        from: "OpenLMS Team",
        to: email,
        subject: subject,
        text: body
    });

    if (error) {
        log(`Error sending email: ${error.message}`);
        return InternalError();
    }
}

export { sendEmail };
