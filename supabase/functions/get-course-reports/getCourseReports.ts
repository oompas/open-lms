import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getRows } from "../_shared/database.ts";
import { toCSV } from "../_shared/helpers.ts";

const getCourseReports = (request: EdgeFunctionRequest) => {

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
        getRows({ table: 'quiz_question' }).then((result) => {
            tables.quizQuestions = toCSV(result.map((question) => {
                if (question.type === "TF") question.answers = ["True", "False"];
                return {
                    'Question ID': question.id,
                    'Course ID': question.courseId,

                    'Question (commas removed)': question.question.replace(/,/g, ''),
                    'Type': question.type === "MC" ? "Multiple Choice" : question.type === "TF" ? "True/False" : "Short Answer",
                    'Answer options (mc/tf only)': question.answers ? JSON.stringify(question.answers).replace(/,/g, ' ') : null,
                    'Correct answer (mc/tf only)': (question.answers && question.correctAnswer) ? question.answers[question.correctAnswer] : null,
                    'Question stats': JSON.stringify(question.stats).replace(/,/g, ' '),
                };
            }));
        }),
        getRows({ table: 'course_attempt' }).then((result) => {
            tables.courseAttempts = toCSV(result.map((attempt) => {
                return {
                    'Attempt ID': attempt.id,
                    'Course ID': attempt.courseId,
                    'User ID': attempt.userId,

                    'Start time': attempt.startTime?.toDate().toUTCString().replace(/,/g, ''),
                    'End time': attempt.endTime?.toDate().toUTCString().replace(/,/g, ''),
                    'Pass?': attempt.pass === true ? "Passed" : attempt.pass === false ? "Failed" : "Not completed",
                };
            }));
        }),
        getRows({ table: 'quiz_attempt' }).then((result) => {
            tables.quizAttempts = toCSV(result.map((attempt) => {
                return {
                    'Quiz attempt ID': attempt.id,
                    'Course ID': attempt.courseId,
                    'Course attempt ID': attempt.courseAttemptId,
                    'User ID': attempt.userId,

                    'Start time': attempt.startTime?.toDate().toUTCString().replace(/,/g, ''),
                    'End time': attempt.endTime?.toDate().toUTCString().replace(/,/g, ''),
                    'Pass?': attempt.pass === true ? "Passed" : attempt.pass === false ? "Failed" : "Not completed",
                    'Score': attempt.score ? attempt.score : "Not marked",
                };
            }));
        }),
        getRows({ table: 'quiz_question_attempt' }).then((result) => {
            tables.quizQuestionAttempts = toCSV(result.map((attempt) => {
                return {
                    'Quiz question attempt ID': attempt.id,
                    'Course ID': attempt.courseId,
                    'Question ID': attempt.questionId,
                    'User ID': attempt.userId,
                    'Course attempt ID': attempt.courseAttemptId,
                    'Quiz question ID': attempt.questionId,

                    'Response (commas removed, number for mc/tf)': typeof attempt.response === 'string' ? attempt.response.replace(/,/g, '') : attempt.response,
                    'Max marks': attempt.maxMarks,
                    'Marks achieved': attempt.marksAchieved ?? "Not marked",
                };
            }));
        })
    ]);

    return data;
}

export default getCourseReports;
