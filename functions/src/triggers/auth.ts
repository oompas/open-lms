import { HttpsError } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import { logger } from "firebase-functions";
import { getCollection, getEmailCollection, DatabaseCollections, deleteDoc } from "../helpers/database";

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
 * -Delete all courses created by the user
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

    if (user.customClaims && user.customClaims["admin"] === true) {
        const userCourses = await getCollection(DatabaseCollections.Course)
            .where('userID', '==', user.uid)
            .get()
            .then((result) => result.docs)
            .catch((err) => { throw new HttpsError('internal', `Error getting user courses: ${err}`) });

        logger.info(`Queried ${userCourses.length} courses created by the user '${user.uid}'`);
        promises.concat(...userCourses.map((course) => course.ref.delete()));
    }

    const numDocs = promises.length;

    return Promise.all(promises)
        .then(() => logger.log(`Successfully deleted ${numDocs} user docs (user profile, courses, course attempts, etc) for user '${user.uid}'`))
        .catch((err) => { throw new HttpsError('internal', `Error deleting user data for user '${user.uid}': ${err}`) });
});

export { beforeSignIn, onUserDelete };
