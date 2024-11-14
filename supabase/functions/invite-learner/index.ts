import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { verifyAdministrator } from "../_shared/auth.ts";
import { sendEmail } from "../_shared/emails.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import getCourseInsightReport from "../get-course-insight-report/getCourseInsightReport.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { courseId: z.string() },
        endpointFunction: getCourseInsightReport,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});

console.log("Hello from Functions!")

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const { email } = await req.json();

    const userId = await verifyAdministrator(req);
    if (userId instanceof Response) return userId;

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
                  <img src="https://lh3.googleusercontent.com/drive-viewer/AKGpihaKJ6WNZbIVmwI2H2DhOpcEjPI20dv54xarsGWLL7Dqpr2YdwjoWz1iJbCXDFjyGA4XsIswyuyiBToe8QTA9Mvddj4Dyw=s2560" 
                  alt="" style="max-width: 200px;">
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

    const emailSend = await sendEmail(email, subject, body);
    if (emailSend instanceof Response) return emailSend;

    return SuccessResponse("Invitation sent!");
});
