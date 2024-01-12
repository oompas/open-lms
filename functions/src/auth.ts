import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import { auth } from "./setup";
import { logger } from "firebase-functions";
import { getCollection, getDoc, sendEmail, verifyIsAuthenticated } from "./helpers";

/**
 * Users must create their accounts through our API (more control & security), calling it from the client is disabled
 */
const createAccount = onCall((request) => {
    // Create user (will throw an error if the email is already in use)
    return auth
        .createUser({
            email: request.data.email,
            emailVerified: false,
            password: request.data.password,
            disabled: false,
        })
        .then((user) => {
            logger.log(`Successfully created new user ${user.uid} (${request.data.email})`);
            return `Successfully created new user ${request.data.email}`;
        })
        .catch((error) => {
            if (error.code === 'auth/invalid-email') {
                logger.warn(`Email ${request.data.email} is invalid`);
                throw new HttpsError('invalid-argument', `Email ${request.data.email} is invalid`);
            }
            if (error.code === 'auth/invalid-password') {
                logger.warn(`Password ${request.data.password} is invalid`);
                throw new HttpsError('invalid-argument', `Password is invalid. It must be a string with at least six characters.`);
            }
            if (error.code === 'auth/email-already-exists') {
                logger.warn(`Email ${request.data.email} in use`);
                throw new HttpsError('already-exists', `Email ${request.data.email} is already in use`);
            }

            logger.error(`Error creating new user (not including email in use): ${error.message} (${error.code})`);
            throw new HttpsError('internal', `Error creating account - please try again later`);
        });
});

/**
 * Sends an email to the requesting user with a link to reset their password
 */
const resetPassword = onCall(async (request) => {

    if (!request.data.email || typeof request.data.email !== 'string') {
        throw new HttpsError("invalid-argument", "Must provide an email address");
    }
    const emailAddress: string = request.data.email;
    const link: string = await auth.generatePasswordResetLink(emailAddress);

    const email = {
        to: emailAddress,
        message: {
            subject: 'Reset your password for OpenLMS',
            html: `<p style="font-size: 16px;">A password reset request was made for your account</p>
                   <p style="font-size: 16px;">Reset your password here: ${link}</p>
                   <p style="font-size: 12px;">If you didn't request this, you can safely disregard this email</p>
                   <p style="font-size: 12px;">Best Regards,</p>
                   <p style="font-size: 12px;">-The OpenLMS Team</p>`,
        }
    };

    return getCollection('/emails/')
        .add(email)
        .then(() => {
            logger.log(`Password reset email created for ${emailAddress}`);
            return `Password reset email created for ${emailAddress}`;
        })
        .catch((err) => {
            logger.log(`Error creating password reset email for ${emailAddress}`);
            return `Error creating password reset email for ${emailAddress}`;
        });
});

/**
 * Logic run before a user can be created (throw errors to block account creation):
 */
const beforeCreate = functions.auth.user().beforeCreate(async (user) => {
    // TODO
});

/**
 * Logic run when a new user signs up:
 * -Create a default document for them in firestore with their email
 * -Send them a verification email
 */
const onUserSignup = functions.auth.user().onCreate(async (user) => {
    if (user.email == null) {
        throw new HttpsError(
            'invalid-argument',
            `User email is null: ${JSON.stringify(user, null, 4)}`
        );
    }

    // Create a default db document for the user
    const defaultDoc = {
        email: user.email,
    };
    await getDoc(`/users/${user.uid}/`)
        .set(defaultDoc)
        .then(() => logger.log(`Default db data successfully created for user: ${user.uid}`))
        .catch((err) => {
            throw new HttpsError('internal', `Error creating default db data for ${user.uid}: ${err}`);
        });

    // Create a verification email
    const verifyLink = await auth
        .generateEmailVerificationLink(user.email)
        .then((link) => link)
        .catch((err) => {
            throw new HttpsError('internal', `Error generating verification link: ${err}`);
        });

    const emailHtml =
        `<p style="font-size: 16px;">Thanks for signing up!</p>
            <p style="font-size: 16px;">Verify your account here: ${verifyLink}</p>
            <p style="font-size: 12px;">If you didn't sign up, please disregard this email</p>
            <p style="font-size: 12px;">Best Regards,</p>
            <p style="font-size: 12px;">-The OpenLMS Team</p>`;

    return sendEmail(user.email, 'Verify your email for OpenLMS', emailHtml, 'email address verification');
});

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
 */
const onUserDelete = functions.auth.user().onDelete(async (user) => {
    return getDoc(`/users/${user.uid}/`)
        .delete()
        .then(() => logger.log(`Successfully deleted user database data for user '${user.uid}'`))
        .catch((err) => {
            throw new HttpsError('internal', `Error deleting user database data for user '${user.uid}': ${err}`);
        });
});

/**
 * Gets the user profile of the requesting user (or an administrator can specify a user)
 */
const getUserProfile = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // @ts-ignore
    const currentUser = await auth.getUser(request.auth.uid)
        .then((userRecord) => userRecord)
        .catch((error) => {
            logger.error(`Can't get UserRecord object for requesting object: ${error}`);
            throw new HttpsError('internal', "Error getting user data, try again later")
        });
    let targetUser = currentUser;

    // Only administrators can view other's profiles
    if (!!request.data.email) {
        // @ts-ignore
        if (!currentUser.customClaims['admin']) {
            logger.error(`Non-admin user '${currentUser.email}' is trying to get another user's (${request.data.email}) profile`);
            throw new HttpsError('invalid-argument', "Only administrators can view other's profiles");
        }

        targetUser = await auth.getUserByEmail(request.data.email)
            .then((user) => user)
            .catch((error) => {
                logger.error(`Error getting UserRecord object: ${error}`);
                throw new HttpsError("internal", "Error getting user data, try again later");
            });
    } else if (!!request.data) {
        throw new HttpsError("invalid-argument", "Invalid payload: must be empty (getting current user's profile)," +
            " or have an 'email' field to specify the user to get the profile for (administrators only)");
    }

    // Query course & course attempt data
    const completedCourseIds = await getCollection("/CourseAttempt/")
        .where('userId', "==", targetUser.uid)
        .where("pass", "==", true)
        .get()
        .then((result) => result.docs.map((doc) => ({ id: doc.id, date: doc.data().endTime })))
        .catch((error) => {
            logger.error(`Error querying completed course attempts: ${error}`);
            throw new HttpsError("internal", "Error getting user data, try again later");
        });

    const completedCourseData = await Promise.all(completedCourseIds.map(async (data) =>
        getDoc(`/Course/${data.id}/`)
            .get()
            // @ts-ignore
            .then((course) => ({ name: course.data().name, link: course.data().link, date: data.date }))
            .catch((error) => {
                logger.error(`Error querying completed course data: ${error}`);
                throw new HttpsError("internal", "Error getting user data, try again later");
            })
    ));

    return {
        name: targetUser.displayName,
        email: targetUser.email,
        signUpDate: targetUser.metadata.creationTime,
        completedCourses: completedCourseData,
    };
});

// TODO: Add isAdmin (return true is user is an admin)

export { createAccount, resetPassword, beforeCreate, onUserSignup, beforeSignIn, onUserDelete, getUserProfile };
