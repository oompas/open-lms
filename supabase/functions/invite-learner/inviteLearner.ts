import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { sendEmail } from "../_shared/emails.ts";

const inviteLearner = async (request: EdgeFunctionRequest) => {

    const { email } = request.getPayload();
    const adminId = request.getRequestUserId();

    request.log(`Entering inviteLearner for admin ${adminId} send  invite to ${email}`);

    const subject = "Welcome to OpenLMS";
    const body = `
          <style>
              body { background-color: #f9f9f9; }
              .invite-button:hover {
                  background: linear-gradient(to right, #0056b3, #007bff);
                  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
              }
          </style>
          <div
              style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: auto;
                  background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 20px;"
          >
              <header style="text-align: center; margin-bottom: 20px;">
                  <img src="https://raw.githubusercontent.com/oompas/open-lms/main/public/openlms.png" 
                  alt="" style="max-width: 100px;">
              </header>
              <section style="margin-bottom: 20px;">
                  <h2 style="font-size: 24px; color: #333333; text-align: center">Welcome to OpenLMS!</h2>
                  <p style="font-size: 16px; color: #444444; text-align: center">Hi there!</p>
                  <p style="font-size: 16px; color: #444444; text-align: center">You've been invited to the OpenLMS learning platform.</p>
                  <div style="text-align: center; margin: 20px 0;">
                      <a href="https://open-lms.ca/" class="invite-button" style="background: linear-gradient(to right, #007bff, #6699ff);
                       color: white; padding: 10px 20px; text-decoration: none; font-size: 16px; border-radius: 5px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.3s ease;">Create An Account</a>
                  </div>
              </section>
              <footer style="font-size: 12px; color: #666666; text-align: center;">
                  <p>Best Regards,</p>
                  <p>The OpenLMS Team</p>
                  <p><a href="https://github.com/oompas/open-lms" style="color: #007bff;">Platform Readme</a> | 
                  <a href="https://github.com/oompas/open-lms/blob/main/LICENSE" style="color: #007bff;">Platform License</a></p>
              </footer>
          </div>`;

    request.log(`Sending email with subject ${subject} to ${email}...`);

    await sendEmail(request, email, subject, body);

    request.log(`Email sent!`);

    return null;
}

export default inviteLearner;
