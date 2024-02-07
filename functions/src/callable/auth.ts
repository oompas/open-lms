import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { DatabaseCollections, getCollection, getDoc, getParameter, verifyIsAuthenticated } from "../helpers/helpers";
import { auth } from "../helpers/setup";

/**
 * Users must create their accounts through our API (more control & security), calling it from the client is disabled
 */
const createAccount = onCall((request) => {

    const email = getParameter(request, "email");
    const password = getParameter(request, "password");
    if (password.length > 100) {
        throw new HttpsError('invalid-argument', "Password can't be over 100 characters long");
    }

    // Create user (will throw an error if the email is already in use)
    return auth
        .createUser({
            email: email,
            emailVerified: false,
            password: password,
            disabled: false,
        })
        .then((user) => {
            logger.log(`Successfully created new user ${user.uid} (${email})`);
            return `Successfully created new user ${email}`;
        })
        .catch((error) => {
            if (error.code === 'auth/invalid-email') {
                logger.warn(`Email ${email} is invalid`);
                throw new HttpsError('invalid-argument', `Email ${email} is invalid`);
            }
            if (error.code === 'auth/invalid-password') {
                logger.warn(`Password ${password} is invalid`);
                throw new HttpsError('invalid-argument', `Password is invalid. It must be a string with at least six characters.`);
            }
            if (error.code === 'auth/email-already-exists') {
                logger.warn(`Email ${email} in use`);
                throw new HttpsError('already-exists', `Email ${email} is already in use`);
            }

            logger.error(`Error creating new user (not including email in use): ${error.message} (${error.code})`);
            throw new HttpsError('internal', `Error creating account - please try again later`);
        });
});

/**
 * Sends an email to the requesting user with a link to reset their password
 */
const resetPassword = onCall(async (request) => {

    const email = getParameter(request, "email");
    const link: string = await auth.generatePasswordResetLink(email)
        .catch(() => { throw new HttpsError('invalid-argument', "Email does not exist or an error occurred") });

    const emailData = {
        to: email,
        message: {
            subject: 'Reset your password for OpenLMS',
            html: `<p style="font-size: 16px;">A password reset request was made for your account</p>
                   <p style="font-size: 16px;">Reset your password here: ${link}</p>
                   <p style="font-size: 12px;">If you didn't request this, you can safely disregard this email</p>
                   <p style="font-size: 12px;">Best Regards,</p>
                   <p style="font-size: 12px;">-The OpenLMS Team</p>`,
        }
    };

    return getCollection(DatabaseCollections.Email)
        .add(emailData)
        .then(() => {
            logger.log(`Password reset email created for ${email}`);
            return `Password reset email created for ${email}`;
        })
        .catch((err) => {
            logger.log(`Error creating password reset email for ${email}`);
            return `Error creating password reset email for ${email}`;
        });
});

/**
 * Gets the user profile of the requesting user (or an administrator can specify a user)
 */
const getUserProfile = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // @ts-ignore
    let user = await auth.getUser(request.auth.uid)
        .then((userRecord) => userRecord)
        .catch((error) => {
            logger.error(`Can't get UserRecord object for requesting object: ${error}`);
            throw new HttpsError('internal', "Error getting user data, try again later")
        });

    // Only administrators can view other's profiles
    if (!!request.data.email) {
        // @ts-ignore
        if (!user.customClaims['admin']) {
            logger.error(`Non-admin user '${user.email}' is trying to request this endpoint`);
            throw new HttpsError('permission-denied', "You must be an administrator to perform this action");
        }

        user = await auth.getUserByEmail(request.data.email)
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
    const completedCourseIds = await getCollection(DatabaseCollections.CourseAttempt)
        .where('userId', "==", user.uid)
        .where("pass", "==", true)
        .get()
        .then((result) => result.docs.map((doc) => ({id: doc.id, date: doc.data().endTime})))
        .catch((error) => {
            logger.error(`Error querying completed course attempts: ${error}`);
            throw new HttpsError("internal", "Error getting user data, try again later");
        });

    const completedCourseData = await Promise.all(completedCourseIds.map(async (data) =>
        getDoc(DatabaseCollections.Course, data.id)
            .get()
            // @ts-ignore
            .then((course) => ({name: course.data().name, link: course.data().link, date: data.date}))
            .catch((error) => {
                logger.error(`Error querying completed course data: ${error}`);
                throw new HttpsError("internal", "Error getting user data, try again later");
            })
    ));

    return {
        name: user.displayName,
        email: user.email,
        signUpDate: user.metadata.creationTime,
        completedCourses: completedCourseData,
    };
});

export { createAccount, resetPassword, getUserProfile };
