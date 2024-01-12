import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { db } from "./setup";
import { logger } from "firebase-functions";
import { auth } from "./setup";
import { UserRecord } from "firebase-admin/auth";

// Helpers for getting a doc/collection
const getCollection = (path: string) => {
    if (!/^\/[a-zA-Z0-9]+\/(([a-zA-Z0-9]+\/){2})*$/.test(path)) {
        throw new HttpsError('internal', `Invalid collection path (${path}), see getCollection() regex`);
    }

    return db.collection(path);
}
const getDoc = (path: string) => {
    if (!/^\/([a-zA-Z0-9]+\/){2}(([a-zA-Z0-9]+\/){2})*$/.test(path)) {
        throw new HttpsError('internal', `Invalid document path (${path}), see getDoc() regex`);
    }

    return db.doc(path);
}

// Check if the requesting user is authenticated
const verifyIsAuthenticated = (request: CallableRequest) => {
    // TODO: Make sure the user exists too
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

    return getCollection('/emails/')
        .add(email)
        .then((doc) => {
            logger.log(`Email ${doc.id} created for ${emailAddress} (${context})`);
        })
        .catch((err) => {
            throw new HttpsError('internal', `Error creating ${context} email for ${emailAddress}: ${err}`);
        });
};

// Throws an error is the given user is not an administrator
const verifyAdminUser = (user: UserRecord) => {
    // @ts-ignore
    if (!user.customClaims['admin']) {
        logger.error(`Non-admin user '${user.email}' is trying to request this endpoint`);
        throw new HttpsError('permission-denied', "You must be an administrator to perform this action");
    }
};

// Verify the requesting user is authenticated and an administrator
const verifyIsAdmin = async (request : CallableRequest) => {
    verifyIsAuthenticated(request);

    // @ts-ignore
    let user = await auth.getUser(request.auth.uid)
        .then((userRecord) => userRecord)
        .catch((error) => {
            logger.error(`Can't get UserRecord object for requesting object: ${error}`);
            throw new HttpsError('internal', "Error getting user data, try again later")
        });

    // @ts-ignore
    if (!user.customClaims['admin']) {
        logger.error(`Non-admin user '${user.email}' is trying to request this endpoint`);
        throw new HttpsError('permission-denied', "You must be an administrator to perform this action");
    }
};

export { getDoc, getCollection, verifyIsAuthenticated, sendEmail, verifyAdminUser, verifyIsAdmin };
