import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { toCSV } from "../_shared/helpers.ts";
import { CourseAttemptService, EnrollmentService } from "../_shared/Service/Services.ts";

const getUserReports = async (request: EdgeFunctionRequest) => {

    request.log(`Entering getUserReports...`);

    const [userRecords, enrollments, courseAttempts] = await Promise.all([
        request.getAllUsers(),
        EnrollmentService.getAllRows(),
        CourseAttemptService.getAllRows()
    ]);

    request.log(`Queried ${userRecords.length} users, ${enrollments.length} enrollments, and ${courseAttempts.length} courses`);

    const userData = userRecords.map((user) => {

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
            'Account creation time': user.created_at.replace(/,/g, ''),

            'Number of courses enrolled': numEnrollments,
            'Number of courses started': numAttempts,
            'Number of courses completed': numComplete,
        }
    });

    request.log(`Constructed user data for ${userData.length} users`);

    return toCSV(userData.sort((a, b) => b['Number of courses enrolled'] - a['Number of courses enrolled']));
}

export default getUserReports;
