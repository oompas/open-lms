import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/lib/v2/providers/https";
import { CourseAttemptDocument, DatabaseCollections, getCollection } from "../helpers/database";

enum CourseStatus {
    NotEnrolled = 1,
    Enrolled = 2,
    InProgress = 3,
    AwaitingMarking = 4,
    Failed = 5,
    Passed = 6
}

/**
 * Get the status of a course for a user
 */
const getCourseStatus = async (courseEnrolled: boolean, courseAttempt: CourseAttemptDocument | null) => {
    let status;
    if (!courseEnrolled) {
        status = CourseStatus.NotEnrolled;
    } else if (courseAttempt === null) {
        status = CourseStatus.Enrolled;
    } else if (courseAttempt?.pass === null) {
        const awaitingMarking = await getCollection(DatabaseCollections.QuizAttempt)
            .where("courseAttemptId", "==", courseAttempt.id)
            .where("endTime", "!=", null)
            .where("pass", "==", null)
            .get()
            .then((docs) => !docs.empty)
            .catch((error) => {
                logger.error(`Error checking if quiz is awaiting marking: ${error}`);
                throw new HttpsError('internal', "Error getting course quiz, please try again later");
            });

        status = awaitingMarking ? CourseStatus.AwaitingMarking : CourseStatus.InProgress;
    } else if (courseAttempt?.pass === false) {
        status = CourseStatus.Failed;
    } else if (courseAttempt?.pass === true) {
        status = CourseStatus.Passed;
    } else {
        throw new HttpsError("internal", `Course is in an invalid state - can't get status`);
    }

    return status;
}

export { getCourseStatus };