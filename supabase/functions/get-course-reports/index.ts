import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { verifyAdministrator } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

/**
 * Converts an array of objects (with the same keys & no embedded objects) into a CSV string
 */
const toCSV = (json: { [key: string]: any }[]) => {
  let csv = "";
  const keys = (json[0] && Object.keys(json[0])) || [];
  csv += keys.join(',') + '\n';
  for (let line of json) {
    csv += keys.map(key => line[key]).join(',') + '\n';
  }
  return csv;
}

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const userId = await verifyAdministrator(req);
    if (userId instanceof Response) return userId;

    const data = {
        courses: '',
        quizQuestions: '',
        courseAttempts: '',
        quizAttempts: '',
        quizQuestionAttempts: ''
    };

    await Promise.all([
        getRows({ table: 'course' }).then((courses) => {
            data.courses = toCSV(courses.map((course) => {
                return {
                  'Course ID': course.id,
                  'Name': course.name,
                  'Description': course.description,
                  'Link': course.link,
                  'Minimum course time (minutes)': course.minTime ?? "None",

                  'Active?': course.active ? "Yes" : "No",
                  'Creation time': course.creationTime?.toDate().toUTCString().replace(/,/g, ''),
                  'Retired?': course.retired?.toDate().toUTCString().replace(/,/g, '') ?? "No",
                  'Version': course.version,
                  'Creator user ID': course.userId,

                  'Has quiz?': course.quiz ? "Yes" : "No",
                  'Quiz max attempts': course.quiz ? course.quiz?.maxAttempts ?? "Unlimited" : "-",
                  'Quiz min score': course.quiz ? course.quiz?.minScore ?? "None" : "-",
                  'Quiz preserve order?': course.quiz ? course.quiz?.preserveOrder ? "Yes" : "No" : "-",
                  'Quiz time limit (minutes)': course.quiz ? course.quiz?.timeLimit ?? "Unlimited" : "-",
                };
            }));
        }),
    ]);

    return SuccessResponse(data);
});
