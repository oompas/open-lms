import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getUserById } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";
import { sendEmail } from "../_shared/emails.ts";

const sendCourseHelp = (request: EdgeFunctionRequest) => {

    const { courseId, feedback } = request.getPayload();

    const user = request.getRequestUser();

    const course = await getRows({ table: 'course', conditions: ['eq', 'id', courseId] });
    if (course instanceof Response) return course;

    const courseCreator = await getUserById(req, course.user_id);
    if (courseCreator instanceof Response) return courseCreator;

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
                  <img src="https://lh3.googleusercontent.com/drive-viewer/AKGpihaKJ6WNZbIVmwI2H2DhOpcEjPI20dv54xarsGWLL7Dqpr2YdwjoWz1iJbCXDFjyGA4XsIswyuyiBToe8QTA9Mvddj4Dyw=s2560" 
                  alt="OpenLMS Logo" style="max-width: 200px;">
              </header>
              <section style="margin-bottom: 20px;">
                  <h2 style="font-size: 24px; color: #333333; text-align: center">Request from User "${user.user_metadata.name}" on Course "${course.name}"</h2>
                  <p style="font-size: 16px; color: #555;">User information: <br> Email: ${user.email} <br> Uid: ${user.id} <br> </p>
                  <p style="font-size: 16px; color: #555;">Request information: <br> Course: ${course.name} <br> User Response: ${feedback}</p>
              </section>
              <footer style="font-size: 12px; color: #666666; text-align: center;">
                  <p>Best Regards,</p>
                  <p>The OpenLMS Team</p>
                  <p><a href="https://github.com/oompas/open-lms" style="color: #007bff;">Platform Readme</a> | 
                  <a href="https://github.com/oompas/open-lms/blob/main/LICENSE" style="color: #007bff;">Platform License</a></p>
              </footer>
          </div>`;

    await sendEmail(courseCreator.email, subject, body);

    return null;
}

export default sendCourseHelp;
