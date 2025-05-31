import { CourseStatus } from "../Enum/CourseStatus.ts";

export type CourseData = {
    name: string;
    description: string;
    link: string;
    minTime: number | null;
    maxQuizAttempts: number | null;
    minQuizScore: number;
    quizTimeLimit: number | null;
    preserveQuizQuestionOrder: boolean;
}

export type QuestionData = {
    type: "TF" | "MC" | "SA";
    question: string;
    marks: number;
    correctAnswer?: number; // For TF and MC
    answers?: string[];    // For MC
}

export type CourseWithStatus = {
    courseId: number;
    status: CourseStatus;
    quizAttemptId?: number;
}

export type GenerateCourseOptions = {
    active?: boolean;
    asAdmin?: boolean;
    courseData?: Partial<CourseData>;
    questionCount?: number;
}

export type GenerateCourseWithStatusOptions = {
    active?: boolean;
    asAdmin?: boolean;
    courseData?: Partial<CourseData>;
    questionCount?: number;

    targetStatus: CourseStatus;
    userId?: string;
    submitCorrectAnswers?: boolean;
}
