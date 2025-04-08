import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { sendEmail } from "../_shared/emails.ts";
import { CourseService } from "../_shared/Service/Services.ts";

const sendCourseHelp = async (request: EdgeFunctionRequest) => {

    const { courseId, feedback } = request.getPayload();

    request.log(`Entering sendCourseHelp with course id ${courseId} and feedback '${feedback}'`);

    const user = request.getRequestUser();

    const course = await CourseService.getById(courseId);
    const courseCreator = await request.getUserById(course.user_id); // TODO: Store email in course

    request.log(`Queried course (${JSON.stringify(course)}) and course creator ${courseCreator.email}`);

    const subject = `Open LMS User Request For Course ${course.name}`;
    const body = `
          <style>
              body { background-color: #f9f9f9; }
          </style>
          <div
            style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: auto;
                background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 20px;"
          >
              <header style="text-align: center; margin-bottom: 20px;">
                  <img src="https://raw.githubusercontent.com/oompas/open-lms/main/public/openlms.png" 
                  alt="OpenLMS Logo" style="max-width: 100px;">
              </header>
              <section style="margin-bottom: 20px;">
                  <h2 style="font-size: 24px; color: #333333; text-align: center">User request for Course "${course.name}"</h2>
                  <p style="font-size: 16px; color: #555;">Request info: <br> Name: ${user.user_metadata.name} <br> Email: ${user.email} <br> ID: ${user.id} <br> </p>
                  <p style="font-size: 16px; color: #555;">User request: ${feedback}</p>
              </section>
              <footer style="font-size: 12px; color: #666666; text-align: center;">
                  <p>Best Regards,</p>
                  <p>The OpenLMS Team</p>
                  <p><a href="https://github.com/oompas/open-lms" style="color: #007bff;">Platform Readme</a> | 
                  <a href="https://github.com/oompas/open-lms/blob/main/LICENSE" style="color: #007bff;">Platform License</a></p>
              </footer>
          </div>`;

    request.log(`Sending email to...`);

    await sendEmail(request, courseCreator.email, subject, body);

    request.log(`Email sent!`);

    return null;
}

export default sendCourseHelp;
