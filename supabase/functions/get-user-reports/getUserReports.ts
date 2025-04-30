import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { toCSV } from "../_shared/helpers.ts";
import { CourseAttemptService, EnrollmentService } from "../_shared/Service/Services.ts";
import { getAllUsers } from "../_shared/auth.ts";

const getUserReports = async (request: EdgeFunctionRequest) => {

    const { withAdmins } = request.getPayload();

    request.log(`Entering getUserReports ${withAdmins ? "with" : "without"} admin data...`);

    const [userQuery, enrollments, courseAttempts] = await Promise.all([
        getAllUsers(),
        EnrollmentService.getAllRows(),
        CourseAttemptService.getAllRows()
    ]);

    const userRecords = withAdmins ? userQuery : userQuery.filter((user) => user.app_metadata.role === "Learner");

    request.log(`Queried ${userRecords.length} users${!withAdmins && " (filtering out non-learners)"}, ${enrollments.length} enrollments, and ${courseAttempts.length} courses`);

    const userData = userRecords.map((user) => {

        const numEnrollments = enrollments.reduce((count, curr) => curr.user_id === user.id ? ++count : count, 0);
        const numAttempts = courseAttempts.reduce((count, curr) => curr.user_id === user.id ? ++count : count, 0);
        const numComplete = courseAttempts.reduce((count, curr) => curr.user_id === user.id && curr.pass === true ? ++count : count, 0);

        return {
            'User ID': user.id,
            'Name': user.user_metadata.display_name,
            'Email': user.email,
            'Role': user.app_metadata.role ?? "Learner",
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
