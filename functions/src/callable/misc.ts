import { HttpsError, onCall } from "firebase-functions/v2/https";
import { sendEmail, verifyIsAdmin, verifyIsAuthenticated } from "../helpers/helpers";
import { DatabaseCollections, getDocData, UserDocument } from "../helpers/database";
import { array, object, string } from "yup";

/**
 * Sends an email to the developers with platform-specific feedback
 */
const sendPlatformFeedback = onCall(async (request) => {

    verifyIsAuthenticated(request);

    const schema = object({
        feedback: object().required()
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((error) => {
            throw new HttpsError('invalid-argument', error.errors.join(", "));
        });

    const devEmail = "18rem8@queensu.ca";

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
                <img src="public/openlms.png" alt="OpenLMS Logo" style="max-width: 200px;">
            </header>
            <section style="margin-bottom: 20px;">
                <h2 style="font-size: 24px; color: #333333;">OpenLMS Platform Feedback</h2>
                <p style="font-size: 16px; color: #444444;">Hi there,</p>
                <p style="font-size: 16px; color: #444444;">A user submitted the feedback form:</p>
                <p style="font-size: 16px; color: #444444;">Name: ${userInfo.name}<br/>Email: ${userInfo.email}
                <br/>Uid: ${uid}<br/>Feedback: ${request.data.feedback}</p>
            </section>
            <footer style="font-size: 12px; color: #666666; text-align: center;">
                <p>Best Regards,</p>
                <p>The OpenLMS Team</p>
                <p><a href="https://github.com/oompas/open-lms" style="color: #007bff;">Platform Readme</a> | 
                <a href="https://github.com/oompas/open-lms/blob/main/LICENSE" style="color: #007bff;">Platform License</a></p>
            </footer>
        </div>`;


    return sendEmail(devEmail, "OpenLMS User Feedback", content, "user bug report/platform feedback");
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
                <img src="public/openlms.png" alt="" style="max-width: 200px;">
            </header>
            <section style="margin-bottom: 20px;">
                <h2 style="font-size: 24px; color: #333333;">Welcome to OpenLMS!</h2>
                <p style="font-size: 16px; color: #444444;">Hi there,</p>
                <p style="font-size: 16px; color: #444444;">You've been invited to the OpenLMS learning platform!</p>
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
