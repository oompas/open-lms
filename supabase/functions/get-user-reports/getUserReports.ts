import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getRows } from "../_shared/database.ts";
import { toCSV } from "../_shared/helpers.ts";

const getUserReports = async (request: EdgeFunctionRequest) => {

    // Get all records at once, then filter through them for each user to reduce queries
    const { userRecords, enrollments, courseAttempts } = await Promise.all([
        request.getAllUsers(),
        getRows('course_enrollment').then((result) => result.map(doc => ({ userId: doc.user_id }))),
        getRows('course_attempt').then((result) => result.map(doc => ({ userId: doc.user_id, pass: doc.pass }))),
    ]).then(([userRecords, enrollments, courseAttempts]) => ({ userRecords, enrollments, courseAttempts }));

    const userData = await Promise.all(userRecords.map((user) => {

        const numEnrollments = enrollments.reduce((count, curr) => curr.user_id === user.id ? ++count : count, 0);
        const numAttempts = courseAttempts.reduce((count, curr) => curr.user_id === user.id ? ++count : count, 0);
        const numComplete = courseAttempts.reduce((count, curr) => curr.user_id === user.id && curr.pass === true ? ++count : count, 0);

        return {
            'User ID': user.id,
            'Name': user.user_metadata.name,
            'Email': user.email,
            'Role': user.user_metadata.role,
            'Account Disabled?': user.disabled ? "Yes" : "No",

            'Email Verified?': user.emailVerified ? "Yes" : "No",
            'Account creation time': user.metadata.creationTime?.replace(/,/g, ''),
            'Last login time': user.metadata.lastSignInTime?.replace(/,/g, ''),
            'Last refresh time': user.metadata.lastRefreshTime?.replace(/,/g, ''),

            'Number of courses enrolled': numEnrollments,
            'Number of courses started': numAttempts,
            'Number of courses completed': numComplete,
        }
    }));

    return toCSV(userData.sort((a, b) => b['Number of courses enrolled'] - a['Number of courses enrolled']));
}

export default getUserReports;
