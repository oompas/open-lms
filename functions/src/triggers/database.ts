import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { DatabaseCollections } from "../helpers/helpers";
import { auth } from "../helpers/setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";

/**
 * Admin permissions are updated by a developer editing the user document in firestore
 */
const updateAdminPermissions = onDocumentUpdated(`${DatabaseCollections.User}/{userId}`, (event) => {

    // @ts-ignore
    const docAfter = event.data.after.data();
    const permissions: {} | { admin: true } = ("admin" in docAfter && docAfter.admin === true) ? { admin: true } : {};

    const userId = event.params.userId;
    return auth.setCustomUserClaims(userId, permissions)
        .then(() => logger.log(`Successfully set user permissions ${JSON.stringify(permissions)} for user ${userId}`))
        .catch((err) => {
            logger.error(`Error setting user permissions (${JSON.stringify(permissions)}) for user ${userId}: ${err}`);
            throw new HttpsError("internal", "Error setting user permissions");
        });
});

export { updateAdminPermissions };
