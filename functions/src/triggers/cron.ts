import { logger } from "firebase-functions";
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { HttpsError } from "firebase-functions/v2/https";
import { auth } from "../helpers/setup";
import { getEmailCollection } from "../helpers/database";

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
 * Every day at midnight UTC, deletes:
 * -30+ day old successful emails
 * -90+ day old failed emails
 */
const purgeExpiredEmails = onSchedule('0 0 * * *', async () => {

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    logger.log(`Getting all emails sent before ${thirtyDaysAgo} (30 days ago)...`);

    const expiredEmails = await getEmailCollection()
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

    logger.log(`Getting all failed emails sent before ${ninetyDaysAgo} (90 days ago)...`);

    const failedEmails = await getEmailCollection()
        .where('delivery.state', '==', 'ERROR')
        .where('delivery.endTime', '<=', ninetyDaysAgo)
        .get()
        .then((result) => {
            logger.info(`Successfully queried ${result.docs.length} failed and expired emails`);
            return result.docs;
        })
        .catch((err) => {
            throw new HttpsError('internal', `Failed to query failed emails: ${err}`);
        });

    if (expiredEmails.length === 0 && failedEmails.length === 0) {
        logger.info(`No expired emails found, quitting cron...`);
        return;
    }

    // And delete them concurrently
    const expiredSuccessfulIds: string[] = [];
    const expiredFailedIds: string[] = [];
    const promises = [
        ...expiredEmails.map((email) =>
            email.ref.delete()
                .then(() => expiredSuccessfulIds.push(email.id))
                .catch((err) => logger.error(`Error deleting email document ${email.id}: ${err}`))
        ),
        ...failedEmails.map((email) =>
            email.ref.delete()
                .then(() => expiredFailedIds.push(email.id))
                .catch((err) => logger.error(`Error deleting email document ${email.id}: ${err}`))
        )
    ];

    return Promise.all(promises)
        .then(() => {
            // Verify all the emails were deleted ok
            if (expiredSuccessfulIds.length !== expiredEmails.length) {
                throw new HttpsError('internal', `expiredSuccessfulIds.length (${expiredSuccessfulIds.length}) !== expiredEmails.length (${expiredEmails.length})`);
            }
            if (expiredFailedIds.length !== failedEmails.length) {
                throw new HttpsError('internal', `expiredFailedIds.length (${expiredFailedIds.length}) !== failedEmails.length (${failedEmails.length})`);
            }

            let returnedMessage = "";
            if (expiredSuccessfulIds.length > 0) {
                returnedMessage += `Successfully deleted ${expiredSuccessfulIds.length} expired successful emails: ${expiredSuccessfulIds} `;
            }
            if (expiredFailedIds.length > 0) {
                returnedMessage += `Successfully deleted ${expiredFailedIds.length} expired failed emails: ${expiredFailedIds}`;
            }
            if (returnedMessage.length === 0) {
                returnedMessage = "No emails were deleted";
            }

            logger.info(returnedMessage)
        })
        .catch((err) => logger.error(`Error deleting expired emails: ${err}`));
});

export { purgeUnverifiedUsers, purgeExpiredEmails };
