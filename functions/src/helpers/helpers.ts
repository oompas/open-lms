import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { auth, db } from "./setup";
import { logger } from "firebase-functions";

// All database collections
enum DatabaseCollections {
    User = "User",
    Course = "Course",
    EnrolledCourse = "EnrolledCourse",
    QuizQuestion = "QuizQuestion",
    CourseAttempt = "CourseAttempt",
    QuizAttempt = "QuizAttempt",
    QuizQuestionAttempt = "QuizQuestionAttempt",
    Email = "Email",
}

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

// Gets a parameter from a request (_fieldsProto is used when unit testing)
const getParameter: any = (request: CallableRequest, parameter: string) => {
    // @ts-ignore
    const value = request.data[parameter] ?? (request._fieldsProto[parameter] ? request._fieldsProto[parameter].stringValue : undefined);
    if (!value) {
        logger.error(`Parameter: ${parameter} Value: ${value} Request: ${JSON.stringify(request)}`);
        throw new HttpsError('invalid-argument', `The parameter ${parameter} is required`);
    }
    return value;
}

// Same as above, but the parameter can be undefined
const getOptionalParameter: any = (request: CallableRequest, parameter: string) => {
    // @ts-ignore
    return request.data[parameter] ?? (request._fieldsProto && request._fieldsProto[parameter] // @ts-ignore
        ? request._fieldsProto[parameter].stringValue : undefined);
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

    return getCollection(DatabaseCollections.Email)
        .add(email)
        .then((doc) => {
            logger.info(`Email ${doc.id} created for ${emailAddress} (${context})`);
            return "Email created successfully";
        })
        .catch((err) => {
            throw new HttpsError('internal', `Error creating ${context} email for ${emailAddress}: ${err}`);
        });
};

// Verify the requesting user is authenticated and an administrator
const verifyIsAdmin = async (request: CallableRequest) => {
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

export { DatabaseCollections, getCollection, getDoc, verifyIsAuthenticated, getParameter, getOptionalParameter, sendEmail, verifyIsAdmin };
