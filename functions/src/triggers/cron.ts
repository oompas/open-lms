import {logger} from "firebase-functions";
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {HttpsError} from "firebase-functions/v2/https";
import {auth} from "../helpers/setup";
import {DatabaseCollections, getCollection} from "../helpers/helpers";

/**
 * Removes users that have been unverified for at least 30 days
 * https://github.com/firebase/functions-samples/blob/main/Node/delete-unused-accounts-cron/functions/index.js
 */
const purgeUnverifiedUsers = onSchedule('0 0 * * *', async () => {

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    logger.log(`Getting all unverified user accounts created before ${thirtyDaysAgo} (30 days ago)...`);

    // Go through users in batches of 1000
    const unverifiedUsers: string[] = [];
    const getUnverifiedUsers = (nextPageToken: string | undefined) => auth.listUsers(1000, nextPageToken)
        .then(async (listUsersResult) => {
            unverifiedUsers.push(...listUsersResult.users
                .filter((user) => !user.emailVerified && new Date(user.metadata.creationTime) < thirtyDaysAgo)
                .map((user) => user.uid));

            if (listUsersResult.pageToken) {
                await getUnverifiedUsers(listUsersResult.pageToken);
            }
        })
        .catch((err) => {
            throw new HttpsError('internal', `Error listing users: ${err.message} (${err.code})`);
        });

    await getUnverifiedUsers(undefined);
    logger.log(`Successfully queried ${unverifiedUsers.length} old unverified users`);
    if (unverifiedUsers.length == 0) return;

    return Promise.all(unverifiedUsers.map((user) => auth.deleteUser(user)))
        .then(() => logger.log(`Successfully deleted ${unverifiedUsers.length} unverified user(s): ${unverifiedUsers}`))
        .catch((err) => logger.error(`Failed to delete unverified user(s): ${err.message} (${err.code})`));
});

/**
 * Every day at midnight UTC, deletes old (30+ days) email metadata in the db
 */
const purgeExpiredEmails = onSchedule('0 0 * * *', async () => {

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    logger.log(`Getting all emails sent before ${thirtyDaysAgo} (30 days ago)...`);

    // Query expired emails
    const expiredEmails = await getCollection(DatabaseCollections.Email)
        .where('delivery.state', '==', 'SUCCESS')
        .where('delivery.endTime', '<=', thirtyDaysAgo)
        .get()
        .then((result) => {
            logger.info(`Successfully queried ${result.docs.length} expired emails`);
            return result.docs;
        })
        .catch((err) => {
            throw new HttpsError('internal', `Failed to query expired emails: ${err}`);
        });

    if (expiredEmails.length === 0) {
        logger.info(`No expired emails found, quitting cron...`);
        return;
    }

    // And delete them concurrently
    return Promise.all(expiredEmails.map((email) => {
        const docId = email.id;
        return email.ref.delete()
            .then(() => logger.info(`Successfully deleted email ${docId}`))
            .catch((err) => logger.error(`Error deleting email document ${docId}`));
    }))
        .then(() => logger.info(`Successfully deleted ${expiredEmails.length} expired emails`))
        .catch((err) => logger.error(`Error deleting expired emails: ${err}`));
});

export { purgeUnverifiedUsers, purgeExpiredEmails };
