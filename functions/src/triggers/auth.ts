import { HttpsError } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import { logger } from "firebase-functions";
import { DatabaseCollections, deleteDoc, getCollection, getEmailCollection } from "../helpers/database";

/**
 * Logic run before a user is able to sign in (throw errors here to block sign in):
 * -User's email must be verified
 */
const beforeSignIn = functions.auth.user().beforeSignIn((user) => {
    if (!user.emailVerified) {
        throw new functions.auth.HttpsError(
            'permission-denied',
            `The email "${user.email}" has not been verified. Please check your email`
        );
    }
});

/**
 * Logic that's run when a user is deleted:
 * -Delete user document from firestore
 * -Delete all emails sent to the user
 * -Delete all other data for the user (course enrollments/attempts/creations/etc)
 */
const onUserDelete = functions.auth.user().onDelete(async (user) => {

    logger.info(`Getting documents for ${user.uid}...`);

    const promises: Promise<any>[] = [];

    promises.push(deleteDoc(DatabaseCollections.User, user.uid));

    const emails = await getEmailCollection()
        .where('to', '==', user.email)
        .get()
        .then((result: { docs: any; }) => result.docs)
        .catch((err: any) => { throw new HttpsError('internal', `Error getting user emails: ${err}`) });
    promises.concat(emails.map((email: { ref: { delete: () => any; }; }) => email.ref.delete()));

    const collectionsToDelete: DatabaseCollections[] = [
        DatabaseCollections.Course,
        DatabaseCollections.QuizQuestion,
        DatabaseCollections.EnrolledCourse,
        DatabaseCollections.CourseAttempt,
        DatabaseCollections.QuizAttempt,
        DatabaseCollections.QuizQuestionAttempt,
    ];

    for (const collection of collectionsToDelete) {
        const docs = await getCollection(collection)
            .where('userID', '==', user.uid)
            .get()
            .then((result) => result.docs)
            .catch((err) => { throw new HttpsError('internal', `Error getting user docs from collection ${collection}: ${err}`) });

        logger.info(`Queried ${docs.length} docs from collection ${collection} created by the user '${user.uid}'`);
        promises.concat(...docs.map((doc) => doc.ref.delete()));
    }

    const numDocs = promises.length;

    return Promise.all(promises)
        .then(() => logger.log(`Successfully deleted ${numDocs} user docs (user profile, courses, course attempts, etc) for user '${user.uid}'`))
        .catch((err) => { throw new HttpsError('internal', `Error deleting user data for user '${user.uid}': ${err}`) });
});

export { beforeSignIn, onUserDelete };
