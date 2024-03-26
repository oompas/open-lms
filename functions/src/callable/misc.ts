import { HttpsError, onCall } from "firebase-functions/v2/https";
import { sendEmail, verifyIsAuthenticated } from "../helpers/helpers";
import { DatabaseCollections, getDocData, UserDocument } from "../helpers/database";
import { object } from "yup";

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

export { sendPlatformFeedback };
