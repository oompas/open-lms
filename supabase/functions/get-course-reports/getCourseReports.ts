import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import {
    CourseAttemptService,
    CourseService,
    QuizAttemptService,
    QuizQuestionAttemptService,
    QuizQuestionService
} from "../_shared/Service/Services.ts";
import { QuestionType } from "../_shared/Enum/QuestionType.ts";
import * as XLSX from "npm:xlsx@0.18.5";

const getCourseReports = async (request: EdgeFunctionRequest) => {

    request.log(`Entering getCourseReports...`);

    const courseDataPromise: Promise<object[]> = CourseService.getAllRows().then((courses) =>
        courses.map((course) => (
            {
                'Course ID': course.id,
                'Name': course.name,
                'Description': course.description,
                'Link': course.link,
                'Minimum course time (minutes)': course.min_time ?? "None",

                'Active?': course.active ? "Yes" : "No",
                'Creation time': new Date(course.created_at).toLocaleString(),
                'Version': course.version,
                'Creator user ID': course.userId,

                'Quiz max attempts': course.max_quiz_attempts ?? "Unlimited",
                'Quiz min score': course.min_quiz_score ?? "None",
                'Quiz preserve question order?': course.preserve_quiz_question_order ? "Yes" : "No",
                'Quiz time limit (minutes)': course.quiz_time_limit ?? "Unlimited",
                'Quiz total marks': course.total_quiz_marks,
                'Quiz number of questions': course.num_quiz_questions
            }
        ))
    );

    const quizQuestionDataPromise: Promise<object[]> = QuizQuestionService.getAllRows().then((quizQuestions) =>
        quizQuestions.map((question) => {
            return {
                'Question ID': question.id,
                'Course ID': question.course_id,
                'Created at': new Date(question.created_at).toLocaleString(),

                'Question': question,
                'Type': question.type === QuestionType.MULTIPLE_CHOICE ? "Multiple Choice" : question.type === QuestionType.TRUE_FALSE ? "True/False" : "Short Answer",
                'Marks': question.marks,
                'Answer options (mc/tf only)': question.answers ? JSON.stringify(question.answers) : null,
                'Correct answer (mc/tf only)': (question.answers && question.correctAnswer) ? question.answers[question.correctAnswer] : null,
                'Question stats': JSON.stringify(question.submitted_answers),
                'Order': question.order ?? "N/A"
            };
        })
    );

    const courseAttemptDataPromise: Promise<object[]> = CourseAttemptService.getAllRows().then((courseAttempts) =>
        courseAttempts.map((attempt) => (
            {
                'Attempt ID': attempt.id,
                'Course ID': attempt.course_id,
                'User ID': attempt.user_id,

                'Start time': new Date(attempt.start_time).toLocaleString(),
                'End time': new Date(attempt.end_time).toLocaleString(),
                'Pass?': attempt.pass === true ? "Passed" : attempt.pass === false ? "Failed" : "Not completed",
            }
        ))
    );

    const quizAttemptDataPromise: Promise<object[]> = QuizAttemptService.getAllRows().then((quizAttempts) =>
        quizAttempts.map((attempt) => (
            {
                'Quiz attempt ID': attempt.id,
                'Course ID': attempt.course_id,
                'Course attempt ID': attempt.course_attempt_id,
                'User ID': attempt.user_id,

                'Start time': new Date(attempt.start_time).toLocaleString(),
                'End time': new Date(attempt.end_time).toLocaleString(),
                'Pass?': attempt.pass === true ? "Passed" : attempt.pass === false ? "Failed" : "Not completed",
                'Score': attempt.score ? attempt.score : "Not marked",
            }
        ))
    );

    const quizQuestionAttemptDataPromise: Promise<object[]> = QuizQuestionAttemptService.getAllRows().then((quizQuestions) =>
        quizQuestions.map((attempt) => (
            {
                'Quiz question attempt ID': attempt.id,
                'Course ID': attempt.course_id,
                'Quiz attempt ID': attempt.quiz_attempt_id,
                'User ID': attempt.user_id,
                'Course attempt ID': attempt.course_attempt_id,
                'Quiz question ID': attempt.quiz_question_id,

                'Type': attempt.type === QuestionType.MULTIPLE_CHOICE ? "Multiple Choice" : attempt.type === QuestionType.TRUE_FALSE ? "True/False" : "Short Answer",
                'Response (number for mc/tf)': typeof attempt.response === 'string' ? attempt.response : attempt.response,
                'Max marks': attempt.maxMarks,
                'Marks achieved': attempt.marksAchieved ?? "Not marked",
            }
        ))
    );

    request.log(`Created promises to grab and transform the required data...`);

    const [courseData, quizQuestionData, courseAttemptData, quizAttemptData, quizQuestionAttemptData] = await Promise.all([
        courseDataPromise,
        quizQuestionDataPromise,
        courseAttemptDataPromise,
        quizAttemptDataPromise,
        quizQuestionAttemptDataPromise
    ]);

    request.log(`Promises completed, constructing data to return...`);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(courseData), 'Courses');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(quizQuestionData), 'Quiz Questions');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(courseAttemptData), 'Course Attempts');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(quizAttemptData), 'Quiz Attempts');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(quizQuestionAttemptData), 'Quiz Question Attempts');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    request.log(`Data constructed - returning success...`);

    return excelBuffer.toString('base64');
}

export default getCourseReports;
