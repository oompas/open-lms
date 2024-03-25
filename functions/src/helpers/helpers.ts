import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { auth, db } from "./setup";
import { logger } from "firebase-functions";
import { DatabaseCollections } from "./database";
import { firestore } from "firebase-admin";

// Helpers for getting a doc/collection
const getCollection = (collection: DatabaseCollections) => db.collection(`/${collection}/`);
const getDoc = (collection: DatabaseCollections, docId: string) => db.doc(`/${collection}/${docId}/`);

// Check if the requesting user is authenticated
const verifyIsAuthenticated = (request: CallableRequest) => {
    if (!request.auth || !request.auth.uid) {
        throw new HttpsError(
            'unauthenticated',
            `You must be logged in to call the API`
        );
    }
};

const docExists = (doc: firestore.DocumentSnapshot<firestore.DocumentData>) => {
    if (!doc.exists) {
        logger.error(`Document does not exist`);
        throw new HttpsError('not-found', `Document does not exist`);
    }
}

// Adds email doc to db (which gets sent by the 'Trigger Email' extension)
const sendEmail = (emailAddress: string, subject: string, html: string, context: string) => {
    const email = {
        to: emailAddress,
        message: {
            subject: subject,
            html: html,
        }
    };

    return db.collection('/Email/')
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

// Verify the requesting user is authenticated and an administrator
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

export { getCollection, getDoc, verifyIsAuthenticated, docExists, sendEmail, verifyIsAdmin, shuffleArray, DOCUMENT_ID_LENGTH, USER_UID_LENGTH };
