import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import {
    DatabaseCollections,
    getCollection,
    getDoc,
    verifyIsAuthenticated
} from "../helpers/helpers";
import { auth } from "../helpers/setup";
import { object, string } from "yup";

/**
 * Users must create their accounts through our API (more control & security), calling it from the client is disabled
 */
const createAccount = onCall(async (request) => {

    logger.info(`Entering createAccount with payload ${JSON.stringify(request.data)} (user: ${request.auth?.uid})`);

    const schema = object({
        email: string().required().email(),
        password: string().required().min(10, "Password must be at least ten characters long"),
    });

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const email = request.data.email;
    const password = request.data.password;

    let score = 0;

    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;
    const hasNumbers = /[0-9]/;
    const hasSpecialChars = /[!#$%&@?]/

    // Check for each password requirement
    if (hasUpperCase.test(password)) score += 1;
    if (hasLowerCase.test(password)) score += 1;
    if (hasNumbers.test(password)) score += 1;
    if (hasSpecialChars.test(password)) score += 1;

    if (score < 4) {
        throw new HttpsError('invalid-argument', "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
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
            return user.uid;
        })
        .catch((error) => {
            if (error.code === 'auth/invalid-email') {
                logger.warn(`Email ${email} is invalid`);
                throw new HttpsError('invalid-argument', `Email ${email} is invalid`);
            }
            if (error.code === 'auth/invalid-password') {
                logger.warn(`Password ${password} is invalid`);
                throw new HttpsError('invalid-argument', `Password is invalid. It must be a string with at least ten characters.`);
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

    logger.info(`Entering resetPassword with payload ${JSON.stringify(request.data)} (user: ${request.auth?.uid})`);

    const schema = object({ email: string().required().email() });

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const email = request.data.email;

    const link: string = await auth.generatePasswordResetLink(email)
        .catch(() => { throw new HttpsError('invalid-argument', "Email does not exist or an error occurred") });

    logger.info(`Generated password reset link for ${email}: ${link}`);

    // const emailData = {
    //     to: email,
    //     message: {
    //         subject: 'Reset Your Password for OpenLMS',
    //         html: `<p style="font-size: 16px;">A password reset request was made for your account</p>
    //                <p style="font-size: 16px;">Reset your password here: ${link}</p>
    //                <p style="font-size: 12px;">If you didn't request this, you can safely disregard this email</p>
    //                <p style="font-size: 12px;">Best Regards,</p>
    //                <p style="font-size: 12px;">The OpenLMS Team</p>`,
    //     }
    // };

    const emailData = {
        to: email,
        message: {
            subject: 'Reset Your Password for OpenLMS',
            html: `
        <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ccc; padding: 20px;">
            <header style="text-align: center; margin-bottom: 20px;">
                <img src="YOUR_LOGO_URL" alt="OpenLMS Logo" style="max-width: 200px;">
            </header>
            <section style="margin-bottom: 20px;">
                <h2 style="font-size: 24px; color: #333;">Password Reset Request</h2>
                <p style="font-size: 16px; color: #555;">Hi there,</p>
                <p style="font-size: 16px; color: #555;">A password reset request was made for your account. 
                If you did not make this request, please ignore this email. Otherwise, you can reset your password by 
                clicking the button below:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${link}" style="background-color: #0066CC; color: white; padding: 10px 20px; 
                    text-decoration: none; font-size: 16px; border-radius: 5px;">Reset Your Password</a>
                </div>
            </section>
            <footer style="font-size: 12px; color: #777; text-align: center;">
                <p>Best Regards,</p>
                <p>The OpenLMS Team</p>
                <p><a href="https://github.com/oompas/open-lms" style="color: #0066CC;">Platform ReadMe</a> | 
                <a href="YOUR_TERMS_SERVICE_URL" style="color: #0066CC;">Platform License</a></p>
            </footer>
        </div>
        `,
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

    const email = request.data.email;

    // @ts-ignore
    let user = await auth.getUser(request.auth.uid)
        .then((userRecord) => userRecord)
        .catch((error) => {
            logger.error(`Can't get UserRecord object for requesting object: ${error}`);
            throw new HttpsError('internal', "Error getting user data, try again later")
        });

    // Only administrators can view other's profiles
    if (email) {
        // @ts-ignore
        if (!user.customClaims['admin']) {
            logger.error(`Non-admin user '${user.email}' is trying to request this endpoint`);
            throw new HttpsError('permission-denied', "You must be an administrator to perform this action");
        }

        user = await auth.getUserByEmail(email)
            .then((user) => user)
            .catch((error) => {
                logger.error(`Error getting UserRecord object: ${error}`);
                throw new HttpsError("internal", "Error getting user data, try again later");
            });
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
