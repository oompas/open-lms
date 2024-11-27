import { sendEmail } from "../_shared/emails.ts";
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";

const sendPlatformHelp = async (request: EdgeFunctionRequest) => {

    const { feedback } = request.getPayload();
    const user = request.getRequestUser();

    request.log(`Entering sendPlatformHelp for user ${user.id} (name: ${user.user_metadata.name}) and feedback ${feedback}`);

    const devEmail = "18rem8@queensu.ca";

    const subject = "OpenLMS Platform Request";
    const body = `
        <style>
            body { background-color: #f9f9f9; }
        </style>
        <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: auto; 
        background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 20px;">
            <header style="text-align: center; margin-bottom: 20px;">
                <img src="https://raw.githubusercontent.com/oompas/open-lms/main/public/openlms.png" 
                alt="OpenLMS Logo" style="max-width: 100px;">
            </header>
            <section style="margin-bottom: 20px;">
                <h2 style="font-size: 24px; color: #333333;">Support request from User "${user.user_metadata.name}"</h2>
                <p style="font-size: 16px; color: #555;">User information: <br> Name: ${user.user_metadata.name} <br> Email: ${user.email} <br> Uid: ${user.id}</p>
                <p style="font-size: 16px; color: #555;">User Response: ${feedback}</p>
            </section>
            <footer style="font-size: 12px; color: #666666; text-align: center;">
                <p>Best Regards,</p>
                <p>The OpenLMS Team</p>
                <p><a href="https://github.com/oompas/open-lms" style="color: #007bff;">Platform Readme</a> | 
                <a href="https://github.com/oompas/open-lms/blob/main/LICENSE" style="color: #007bff;">Platform License</a></p>
            </footer>
        </div>`;

    request.log(`Sending email with subject ${subject} to ${devEmail}...`);

    await sendEmail(request, devEmail, subject, body);

    request.log(`Email sent!`);

    return null;
}

export default sendPlatformHelp;
