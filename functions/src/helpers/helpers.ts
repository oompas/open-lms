import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { auth } from "./setup";
import { logger } from "firebase-functions";
import { getEmailCollection } from "./database";

// Check if the requesting user is authenticated
const verifyIsAuthenticated = (request: CallableRequest) => {
    if (!request.auth || !request.auth.uid) {
        throw new HttpsError(
            'unauthenticated',
            `You must be logged in to call the API`
        );
    }
};

// Adds email doc to db (which gets sent by the 'Trigger Email' extension)
const sendEmail = (emailAddress: string, subject: string, html: string, context: string) => {
    const email = {
        to: emailAddress,
        message: {
            subject: subject,
            html: html,
        }
    };

    return getEmailCollection()
        .add(email)
        .then((doc) => {
            logger.info(`Email ${doc.id} created for ${emailAddress} (${context})`);
            return "Email created successfully";
        })
        .catch((err) => {
            logger.error(`Error creating ${context} email for ${emailAddress}: ${err}`);
            throw new HttpsError('internal', `Error creating ${context} email for ${emailAddress}`);
        });
};

// Verify the requesting user is authenticated and a learner (not an admin or developer)
const verifyIsLearner = async (request: CallableRequest) => {
    verifyIsAuthenticated(request);

    // @ts-ignore
    const user = await auth.getUser(request.auth.uid)
        .then((userRecord) => userRecord)
        .catch((error) => {
            logger.error(`Can't get UserRecord object for requesting object: ${error}`);
            throw new HttpsError('internal', "Error getting user data, try again later")
        });

    if (user.customClaims && ("admin" in user.customClaims || user.customClaims["admin"] === true || "developer" in user.customClaims || user.customClaims["developer"] === true)) {
        logger.error(`Non-learner user '${user.email}' is trying to request this endpoint (admin: ${"admin" in user.customClaims}, developer: ${"developer" in user.customClaims})`);
        throw new HttpsError('permission-denied', "You must be a learner to perform this action");
    }
}

// Verify the requesting user is authenticated and an administrator (developers are also admins)
const verifyIsAdmin = async (request: CallableRequest) => {
    verifyIsAuthenticated(request);

    // @ts-ignore
    const user = await auth.getUser(request.auth.uid)
        .then((userRecord) => userRecord)
        .catch((error) => {
            logger.error(`Can't get UserRecord object for requesting object: ${error}`);
            throw new HttpsError('internal', "Error getting user data, try again later")
        });

    if (!user.customClaims || !("admin" in user.customClaims) || user.customClaims["admin"] !== true) {
        logger.error(`Non-admin user '${user.email}' is trying to request this endpoint`);
        throw new HttpsError('permission-denied', "You must be an administrator to perform this action");
    }
};

const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

const DOCUMENT_ID_LENGTH = 20;
const USER_UID_LENGTH = 28;

export { verifyIsAuthenticated, sendEmail, verifyIsLearner, verifyIsAdmin, shuffleArray, DOCUMENT_ID_LENGTH, USER_UID_LENGTH };
