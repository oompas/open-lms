import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getCollection, verifyIsAdmin } from "../helpers/helpers";
import { logger } from "firebase-functions";

/**
 * Returns a list of all learners on the platform with their:
 * -uid
 * -name
 * -Number of courses completed
 */
const getUserReports = onCall(async (request) => {

    await verifyIsAdmin(request);

    return getCollection("/User/")
        .where("position", "==", "learner")
        .get()
        .then((users) => users.docs.map((user) => ({ uid: user.id, name: user.data().name, coursesComplete: user.data().coursesComplete })))
        .catch((error) => {
            logger.error(`Error querying users: ${error}`);
            throw new HttpsError('internal', "Error getting uer reports, please try again later");
        });
});

/**
 * Returns a list of all courses on the platform with their:
 * -course ID
 * -name
 * -Number of enrolled learners
 * -Number of learners who completed the course
 * -Average course completion time (not including quiz attempt(s))
 * -Average number of quiz attempts
 */
const getCourseReports = onCall(async (request) => {

    await verifyIsAdmin(request);

    // TODO: Query all courses & get metrics
});

export { getUserReports, getCourseReports };
