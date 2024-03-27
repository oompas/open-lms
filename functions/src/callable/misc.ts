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
    const content = `A user provided platform feedback:<br/>Name: ${userInfo.name}<br/>Email: ${userInfo.email}<br/>Uid: ${uid}<br/>Feedback: ${request.data.feedback}`;

    return sendEmail(devEmail, "OpenLMS user feedback", content, "user bug report/platform feedback");
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
    const body = "Welcome to Queen's OpenLMS! You can create an account here: https://open-lms.ca/";
    const context = "learner invitation";

    return Promise.all(request.data.emails.map((email: string) => {
        return sendEmail(email, subject, body, context);
    })).then(() => "Invitations sent successfully");
});

export { sendPlatformFeedback, inviteLearner };
