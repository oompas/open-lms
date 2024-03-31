import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { sendEmail, USER_UID_LENGTH, verifyIsAdmin, verifyIsAuthenticated } from "../helpers/helpers";
import { auth } from "../helpers/setup";
import { object, string } from "yup";
import {
    addDocWithId,
    CourseDocument,
    DatabaseCollections,
    getCollection,
    getDocData,
    QuizAttemptDocument,
} from "../helpers/database";
import { firestore } from "firebase-admin";

/**
 * Users must create their accounts through our API (more control & security), calling it from the client is disabled
 */
const createAccount = onCall(async (request) => {

    logger.info(`Entering createAccount with payload ${JSON.stringify(request.data)} (user: ${request.auth?.uid})`);

    const schema = object({
        name: string().required().min(1, "Name must be at least one character long"),
        email: string().required().email(),
        password: string().required().min(10, "Password must be at least ten characters long"),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const { email, password, name } = request.data;

    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;
    const hasNumbers = /[0-9]/;
    const hasSpecialChars = /[!#$%&@?]/

    // Check for each password requirement
    if (!(hasUpperCase.test(password) && hasLowerCase.test(password) && hasNumbers.test(password) && hasSpecialChars.test(password))) {
        throw new HttpsError('invalid-argument', "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
    }

    // Create user (will throw an error if the email is already in use)
    return auth
        .createUser({
            email: email,
            password: password,
            displayName: name,
            emailVerified: false,
            disabled: false
        })
        .then(async (user) => {
            logger.info("Successfully created user, adding user document to db & sending verification email...");

            const defaultDoc = {
                email: email,
                name: name,
                admin: false,
                signUpTime: firestore.FieldValue.serverTimestamp()
            };
            await addDocWithId(DatabaseCollections.User, user.uid, defaultDoc);

            // Create a verification email
            const verifyLink = await auth
                .generateEmailVerificationLink(email)
                .then((link) => link)
                .catch((err) => {
                    logger.error(`Error generating verification link: ${err}`)
                    throw new HttpsError('internal', `Error generating verification link, please try again later`);
                });

            const emailHtml = `
                <style>
                    body { background-color: #f9f9f9; }
                    .verify-button:hover {
                        background: linear-gradient(to right, #0056b3, #007bff);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    }
                </style>
                <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: auto; 
                background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 20px;">
                    <header style="text-align: center; margin-bottom: 20px;">
                        <img src="https://lh3.googleusercontent.com/drive-viewer/AKGpihaKJ6WNZbIVmwI2H2DhOpcEjPI20dv54xarsGWLL7Dqpr2YdwjoWz1iJbCXDFjyGA4XsIswyuyiBToe8QTA9Mvddj4Dyw=s2560" 
                        alt="OpenLMS Logo" style="max-width: 200px;">
                    </header>
                    <section style="margin-bottom: 20px;">
                        <h2 style="font-size: 24px; color: #333333; text-align: center">Thanks for signing up to OpenLMS!</h2>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${verifyLink}" class="verify-button" style="background: linear-gradient(to right, #007bff, #6699ff);
                             color: white; padding: 10px 20px; text-decoration: none; font-size: 16px; border-radius: 5px;
                              box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.3s ease;">Verify Your Account</a>
                        </div>
                        <p style="font-size: 16px; color: #444444; text-align: center">If you didn't sign up, please disregard this email.</p>
                    </section>
                    <footer style="font-size: 12px; color: #666666; text-align: center;">
                        <p>Best Regards,</p>
                        <p>The OpenLMS Team</p>
                        <p><a href="https://github.com/oompas/open-lms" style="color: #007bff;">Platform Readme</a> | 
                        <a href="https://github.com/oompas/open-lms/blob/main/LICENSE" style="color: #007bff;">Platform License</a></p>
                    </footer>
                </div>`;

            await sendEmail(email, 'Verify Your Email', emailHtml, 'email address verification');

            logger.info(`Verification email sent and user document created`);
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

    const schema = object({
        email: string().required().email()
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const email = request.data.email;

    const link: string = await auth.generatePasswordResetLink(email)
        .catch((err) => {
            logger.error(`Error generating password reset link: ${err}`);
            throw new HttpsError('invalid-argument', "Email does not exist or an error occurred")
        });

    logger.info(`Generated password reset link for ${email}: ${link}`);

    const emailHtml = `
        <style>
            .reset-button:hover {
                background: linear-gradient(to right, #0056b3, #007bff);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
        </style>
        <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ccc; padding: 20px;">
            <header style="text-align: center; margin-bottom: 20px;">
                <img src="https://lh3.googleusercontent.com/drive-viewer/AKGpihaKJ6WNZbIVmwI2H2DhOpcEjPI20dv54xarsGWLL7Dqpr2YdwjoWz1iJbCXDFjyGA4XsIswyuyiBToe8QTA9Mvddj4Dyw=s2560" 
                alt="OpenLMS Logo" style="max-width: 200px;">
            </header>
            <section style="margin-bottom: 20px;">
                <h2 style="font-size: 24px; color: #333; text-align: center">Password Reset Request</h2>
                <p style="font-size: 16px; color: #555; text-align: center">Hi there!</p>
                <p style="font-size: 16px; color: #555; text-align: center">A password reset request was made for your account. 
                    If you did not make this request, please ignore this email. Otherwise, you can reset your
                    password by clicking below:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${link}" class="reset-button" style="background: linear-gradient(to right, #007bff, #6699ff);
                     color: white; padding: 10px 20px; text-decoration: none; font-size: 16px; border-radius: 5px;
                     box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.3s ease;">Reset Your Password</a>
                </div>
            </section>
            <footer style="font-size: 12px; color: #777; text-align: center;">
                <p>Best Regards,</p>
                <p>The OpenLMS Team</p>
                <p><a href="https://github.com/oompas/open-lms" style="color: #0066CC;">Platform Readme</a> | 
                <a href="https://github.com/oompas/open-lms/blob/main/LICENSE" style="color: #0066CC;">Platform License</a></p>
            </footer>
        </div>`;

    return sendEmail(email, 'Reset Your Password', emailHtml, 'password reset');
});

/**
 * Gets the user profile of the requesting user (or an administrator can specify a user)
 */
const getUserProfile = onCall(async (request) => {

    logger.info(`Entering getUserProfile with payload ${JSON.stringify(request.data)} (user: ${request.auth?.uid})`);

    verifyIsAuthenticated(request);

    const schema = object({
        targetUid: string().length(USER_UID_LENGTH).optional(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    // @ts-ignore
    const targetUserUid = request.data.targetUid ?? request.auth.uid;
    if (request.data.targetUid) {
        await verifyIsAdmin(request); // Only administrators can view other's profiles
    }
    const userRecord = await auth.getUser(targetUserUid);

    // Query all enrolled courses
    const enrolledCourses = await getCollection(DatabaseCollections.EnrolledCourse)
        .where('userId', "==", targetUserUid)
        .get()
        .then((result) => result.docs.map((doc) => doc.data().courseId))
        .catch((error) => {
            logger.error(`Error querying enrolled courses: ${error}`);
            throw new HttpsError("internal", "Error getting user data, try again later");
        });

    const courseNames: { [key: string]: string } = {};
    await Promise.all(enrolledCourses.map(async (courseId) => // @ts-ignore
        getDocData(DatabaseCollections.Course, courseId).then((course: CourseDocument) => courseNames[courseId] = course.name)
    ));

    // Query course & course attempt data
    const completedCourseIds = await getCollection(DatabaseCollections.CourseAttempt)
        .where('userId', "==", targetUserUid)
        .where("pass", "==", true)
        .get()
        .then((result) => {
            return result.docs.map((doc) => ({ id: doc.id, courseId: doc.data().courseId, date: doc.data().endTime }));
        })
        .catch((error) => {
            logger.error(`Error querying completed course attempts: ${error}`);
            throw new HttpsError("internal", "Error getting user data, try again later");
        });

    const completedCourseData = await Promise.all(completedCourseIds.map(async (data) =>
        getDocData(DatabaseCollections.Course, data.courseId) // @ts-ignore
            .then((course: CourseDocument) => {
                return { courseId: course.id, name: course.name, link: course.link, date: data.date._seconds };
            })
    ));

    const quizAttemptData = await getCollection(DatabaseCollections.QuizAttempt)
        .where('userId', "==", targetUserUid)
        .get()
        .then((result) => result.docs.map((doc) => {
            const data = doc.data() as QuizAttemptDocument;
            return {
                id: doc.id,
                courseId: data.courseId,
                courseName: courseNames[data.courseId],
                userId: data.userId,
                courseAttemptId: data.courseAttemptId,
                startTime: data.startTime.seconds,
                endTime: data.endTime?.seconds,
                score: data.score,
            };
        }))
        .catch((error) => {
            logger.error(`Error querying quiz attempts: ${error}`);
            throw new HttpsError("internal", "Error getting user data, try again later");
        });

    return {
        name: userRecord.displayName,
        email: userRecord.email,
        role: userRecord.customClaims?.developer ? "Developer" : userRecord.customClaims?.admin ? "Administrator" : "Learner",
        disabled: userRecord.disabled,
        signUpDate: Date.parse(userRecord.metadata.creationTime),
        lastSignIn: userRecord.metadata.lastRefreshTime ? Date.parse(userRecord.metadata.lastRefreshTime) : -1,
        enrolledCourses: enrolledCourses.map((courseId) => ({ id: courseId, name: courseNames[courseId] })),
        completedCourses: completedCourseData,
        quizAttempts: quizAttemptData
    };
});

/**
 * Flips the user's account enable status (disables the account if enabled, enables if disabled)
 */
const updateUserEnabled = onCall(async (request) => {

    logger.info(`Entering disableUserAccount with payload ${JSON.stringify(request.data)} (user: ${request.auth?.uid})`);

    await verifyIsAdmin(request);

    const schema = object({
        targetUid: string().length(USER_UID_LENGTH).required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const targetUserUid = request.data.targetUid;

    // Can't disable an admin or developer
    const user = await auth.getUser(targetUserUid)
        .then((user) => {
            if (user.customClaims?.admin || user.customClaims?.developer) {
                logger.warn(`Cannot disable admin user ${targetUserUid}`);
                throw new HttpsError('invalid-argument', `Cannot disable admin/developer user ${targetUserUid}`);
            }
            return user;
        })
        .catch((error) => {
            logger.error(`Error getting user ${targetUserUid}: ${error}`);
            throw new HttpsError('not-found', `User ${targetUserUid} not found`);
        });

    return auth.updateUser(targetUserUid, { disabled: !user.disabled })
        .then(() => {
            logger.info(`Successfully disabled user ${targetUserUid}`);
            return targetUserUid;
        })
        .catch((error) => {
            logger.error(`Error disabling user ${targetUserUid}: ${error}`);
            throw new HttpsError('internal', `Error disabling user ${targetUserUid}`);
        });
});

export { createAccount, resetPassword, getUserProfile, updateUserEnabled };
