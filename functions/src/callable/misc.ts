import { HttpsError, onCall } from "firebase-functions/v2/https";
import { DatabaseCollections, getDoc, sendEmail, verifyIsAuthenticated } from "../helpers/helpers";
import { logger } from "firebase-functions";

/**
 * Sends an email to the developers with platform-specific feedback
 */
const sendPlatformFeedback = onCall((request) => {

    verifyIsAuthenticated(request);

    if (!request.data.feedback || typeof request.data.feedback !== 'string') {
        throw new HttpsError('invalid-argument', "Must provide user feedback (string)");
    }

    const devEmail = "18rem8@queensu.ca";

    // @ts-ignore
    const userInfo: { name: string, email: string, uid: string } = await getDoc(DatabaseCollections.User, request.auth.uid)
        .get() // @ts-ignore
        .then((user) => ({ name: user.data().name, email: user.data().email, uid: user.id }))
        .catch((error) => { // @ts-ignore
            logger.error(`Error getting user (${request.auth.uid}): ${error}`);
            throw new HttpsError("internal", "Error sending course feedback, please try again later");
        });

    const content = `A user provided platform feedback:<br/>Name: ${userInfo.name}<br/>Email: ${userInfo.email}<br/>Uid: ${userInfo.uid}<br/>Feedback: ${request.data.feedback}`;
    return sendEmail(devEmail, "OpenLMS user feedback", content, "user bug report/platform feedback");
});

export { sendPlatformFeedback };
