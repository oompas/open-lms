import { HttpsError, onCall } from "firebase-functions/v2/https";
import { sendEmail, verifyIsAdmin, verifyIsLearner } from "../helpers/helpers";
import { DatabaseCollections, getDocData, UserDocument } from "../helpers/database";
import { array, object, string } from "yup";
import { logger } from "firebase-functions";

/**
 * Sends an email to the developers with platform-specific feedback
 */
const sendPlatformFeedback = onCall(async (request) => {

    logger.info(`Entering sendPlatformFeedback for user ${request.auth?.uid} with data: ${JSON.stringify(request.data)}`);

    await verifyIsLearner(request);

    const schema = object({
        feedback: string().required()
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((error) => {
            throw new HttpsError('invalid-argument', error.errors.join(", "));
        });

    logger.info("Schema verification passed");

    const devEmail = "support@open-lms.ca";

    // @ts-ignore
    const uid: string = request.auth.uid;

    const userInfo = await getDocData(DatabaseCollections.User, uid) as UserDocument;
    const content = `
        <style>
            body { background-color: #f9f9f9; }
        </style>
        <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: auto; 
        background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 20px;">
            <header style="text-align: center; margin-bottom: 20px;">
                <img src="https://lh3.googleusercontent.com/drive-viewer/AKGpihaKJ6WNZbIVmwI2H2DhOpcEjPI20dv54xarsGWLL7Dqpr2YdwjoWz1iJbCXDFjyGA4XsIswyuyiBToe8QTA9Mvddj4Dyw=s2560" 
                alt="OpenLMS Logo" style="max-width: 200px;">
            </header>
            <section style="margin-bottom: 20px;">
                <h2 style="font-size: 24px; color: #333333;">Request from User "${userInfo.name}"</h2>
                <p style="font-size: 16px; color: #555;">User information: <br> Name: ${userInfo.name} <br> Email: ${userInfo.email} <br> Uid: ${uid}</p>
                <p style="font-size: 16px; color: #555;">User Response: ${request.data.feedback}</p>
            </section>
            <footer style="font-size: 12px; color: #666666; text-align: center;">
                <p>Best Regards,</p>
                <p>The OpenLMS Team</p>
                <p><a href="https://github.com/oompas/open-lms" style="color: #007bff;">Platform Readme</a> | 
                <a href="https://github.com/oompas/open-lms/blob/main/LICENSE" style="color: #007bff;">Platform License</a></p>
            </footer>
        </div>`;

    return sendEmail(devEmail, "OpenLMS Technical Request", content, "user bug report/platform feedback");
});

/**
 * Invites new learner(s) to the platform by sending them and email
 */
const inviteLearner = onCall(async (request) => {

    await verifyIsAdmin(request);

    const schema = object({
        emails: array().of(string().email()).min(1).max(1000).required()
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((error) => {
            throw new HttpsError('invalid-argument', error.errors.join(", "));
        });

    const subject = "Welcome to OpenLMS";
    const body = `
        <style>
            body { background-color: #f9f9f9; }
            .invite-button:hover {
                background: linear-gradient(to right, #0056b3, #007bff);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
        </style>
        <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: auto; 
        background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 20px;">
            <header style="text-align: center; margin-bottom: 20px;">
                <img src="https://lh3.googleusercontent.com/drive-viewer/AKGpihaKJ6WNZbIVmwI2H2DhOpcEjPI20dv54xarsGWLL7Dqpr2YdwjoWz1iJbCXDFjyGA4XsIswyuyiBToe8QTA9Mvddj4Dyw=s2560" 
                alt="" style="max-width: 200px;">
            </header>
            <section style="margin-bottom: 20px;">
                <h2 style="font-size: 24px; color: #333333; text-align: center">Welcome to OpenLMS!</h2>
                <p style="font-size: 16px; color: #444444; text-align: center">Hi there!</p>
                <p style="font-size: 16px; color: #444444; text-align: center">You've been invited to the OpenLMS learning platform.</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="https://open-lms.ca/" class="invite-button" style="background: linear-gradient(to right, #007bff, #6699ff);
                     color: white; padding: 10px 20px; text-decoration: none; font-size: 16px; border-radius: 5px;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.3s ease;">Create An Account</a>
                </div>
            </section>
            <footer style="font-size: 12px; color: #666666; text-align: center;">
                <p>Best Regards,</p>
                <p>The OpenLMS Team</p>
                <p><a href="https://github.com/oompas/open-lms" style="color: #007bff;">Platform Readme</a> | 
                <a href="https://github.com/oompas/open-lms/blob/main/LICENSE" style="color: #007bff;">Platform License</a></p>
            </footer>
        </div>`;

    const context = "learner invitation";

    return Promise.all(request.data.emails.map((email: string) => {
        return sendEmail(email, subject, body, context);
    })).then(() => "Invitations sent successfully");
});

export { sendPlatformFeedback, inviteLearner };
