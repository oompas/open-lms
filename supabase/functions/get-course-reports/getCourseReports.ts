import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { toCSV } from "../_shared/helpers.ts";
import {
    CourseAttemptService,
    CourseService,
    QuizAttemptService,
    QuizQuestionAttemptService,
    QuizQuestionService
} from "../_shared/Service/Services.ts";

const getCourseReports = async (request: EdgeFunctionRequest) => {

    const tables = {
        courses: '',
        quizQuestions: '',
        courseAttempts: '',
        quizAttempts: '',
        quizQuestionAttempts: ''
    };

    request.log(`Entering getCourseReports...`);

    await Promise.all([
        CourseService.getAllRows().then((courses) => {
            tables.courses = toCSV(courses.map((course) => {
                return {
                    'Course ID': course.id,
                    'Name': course.name,
                    'Description': course.description,
                    'Link': course.link,
                    'Minimum course time (minutes)': course.minTime ?? "None",

                    'Active?': course.active ? "Yes" : "No",
                    'Creation time': new Date(course.created_at).toLocaleString(),
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
        QuizQuestionService.getAllRows().then((result) => {
            tables.quizQuestions = toCSV(result.map((question) => {
                if (question.type === "TF") question.answers = ["True", "False"];
                return {
                    'Question ID': question.id,
                    'Course ID': question.course_id,

                    'Question (commas removed)': question.question.replace(/,/g, ''),
                    'Type': question.type === "MC" ? "Multiple Choice" : question.type === "TF" ? "True/False" : "Short Answer",
                    'Answer options (mc/tf only)': question.answers ? JSON.stringify(question.answers).replace(/,/g, ' ') : null,
                    'Correct answer (mc/tf only)': (question.answers && question.correctAnswer) ? question.answers[question.correctAnswer] : null,
                    'Question stats': JSON.stringify(question.submitted_answers).replace(/,/g, ' '),
                };
            }));
        }),
        CourseAttemptService.getAllRows().then((result) => {
            tables.courseAttempts = toCSV(result.map((attempt) => {
                return {
                    'Attempt ID': attempt.id,
                    'Course ID': attempt.course_id,
                    'User ID': attempt.user_id,

                    'Start time': new Date(attempt.start_time).toLocaleString(),
                    'End time': new Date(attempt.end_time).toLocaleString(),
                    'Pass?': attempt.pass === true ? "Passed" : attempt.pass === false ? "Failed" : "Not completed",
                };
            }));
        }),
        QuizAttemptService.getAllRows().then((result) => {
            tables.quizAttempts = toCSV(result.map((attempt) => {
                return {
                    'Quiz attempt ID': attempt.id,
                    'Course ID': attempt.course_id,
                    'Course attempt ID': attempt.course_attempt_id,
                    'User ID': attempt.user_id,

                    'Start time': new Date(attempt.start_time).toLocaleString(),
                    'End time': new Date(attempt.end_time).toLocaleString(),
                    'Pass?': attempt.pass === true ? "Passed" : attempt.pass === false ? "Failed" : "Not completed",
                    'Score': attempt.score ? attempt.score : "Not marked",
                };
            }));
        }),
        QuizQuestionAttemptService.getAllRows().then((result) => {
            tables.quizQuestionAttempts = toCSV(result.map((attempt) => {
                return {
                    'Quiz question attempt ID': attempt.id,
                    'Course ID': attempt.course_id,
                    'Question ID': attempt.question_id,
                    'User ID': attempt.user_id,
                    'Course attempt ID': attempt.course_attempt_id,
                    'Quiz question ID': attempt.question_id,

                    'Response (commas removed, number for mc/tf)': typeof attempt.response === 'string' ? attempt.response.replace(/,/g, '') : attempt.response,
                    'Max marks': attempt.maxMarks,
                    'Marks achieved': attempt.marksAchieved ?? "Not marked",
                };
            }));
        })
    ]);

    request.log(`Date constructed - returning success...`);

    return tables;
}

export default getCourseReports;
