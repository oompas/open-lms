"use client";
import Link from "next/link";
import IDCourse from "./IDCourse";
import Quiz from "./Quiz"
import { MdArrowBack } from "react-icons/md";
import { useEffect, useState } from "react";
import Checkbox from "@/components/Checkbox";
import { useAsync } from "react-async-hook";
import { callAPI } from "@/config/supabase.ts";

enum CourseStatus {
    NOT_ENROLLED = "NOT_ENROLLED",
    ENROLLED = "ENROLLED",
    IN_PROGRESS = "IN_PROGRESS",
    AWAITING_MARKING = "AWAITING_MARKING",
    FAILED = "FAILED",
    COMPLETED = "COMPLETED"
}

export default function Course({ params }: { params: { id: string } }) {

    const getCourseData = useAsync(() => callAPI('get-course-data', { courseId: params.id })
        .then((r) => {
            setCourseData(r.data);
            setStatus(r.data.status);
            setCourseAttemptId(r.data.attempts.currentAttemptId);
        }), []);

    const [courseData, setCourseData] = useState<undefined | object>(undefined);

    const [status, setStatus] = useState(CourseStatus.NOT_ENROLLED);
    const [timeDone, setTimeDone] = useState(false);
    const [courseAttemptId, setCourseAttemptId] = useState(null);
    const [quizAttemptId, setQuizAttemptId] = useState(null);
    const [quizStarted, setQuizStarted] = useState<null|boolean>(null);

    useEffect(() => {
        if (!getCourseData.result?.data) {
            return;
        }

        console.log(`Status: ${status} Time done: ${timeDone}`);
        setQuizStarted(status === CourseStatus.NOT_ENROLLED || status === CourseStatus.ENROLLED || status === CourseStatus.COMPLETED || !timeDone
            ? null // @ts-ignore
            : getCourseData.result.data.currentQuiz !== null
        );
    }, [status, timeDone]);

    const renderCourse = () => {
        const getCourseTimeString = () => {
            if (courseData.minTime < 60) {
                return courseData.minTime + " minute" + (courseData.minTime === 1 ? "" : "s");
            }
            return Math.floor(courseData.minTime / 60) + " hour" + (Math.floor(courseData.minTime / 60) > 1 ? "s" : "")
                + (courseData.minTime % 60 > 0 ? " and " + courseData.minTime % 60 + " minute" + (courseData.minTime % 60 === 1 ? "" : "s") : "");
        }

        const quizStarted = () => {
            const attemptId = courseData.attempts?.currentQuizAttemptId;
            if (attemptId) {
                return attemptId;
            }
            return courseData.status === CourseStatus.IN_PROGRESS && timeDone ? false : null;
        }

        return (
            <>
                <IDCourse
                    course={courseData}
                    timeDone={timeDone}
                    setTimeDone={setTimeDone}
                    status={status}
                    setStatus={setStatus}
                    setCourseAttemptId={setCourseAttemptId}
                />

                <div className="mt-8 text-2xl">
                    <h1 className="mb-4">To complete the course:</h1>
                    {courseData.minTime &&
                        <div className="flex flex-row items-center mt-2">
                            <Checkbox checked={timeDone} setChecked={null} style="mr-3"/>
                            <div>{`Spend at least ${getCourseTimeString()} on the course`}</div>
                        </div>
                    }
                    {courseData.quiz &&
                        <div className="flex flex-row items-center mt-2">
                            <Checkbox checked={courseData.status === CourseStatus.COMPLETED} setChecked={null} style="mr-3"/>
                            <div>{"Pass the quiz"}</div>
                        </div>
                    }
                </div>

                { courseData.quiz &&
                    <div className="mt-4">
                        <div className="flex flex-col w-fit">
                            <Quiz
                                key={1}
                                length={courseData.quiz.timeLimit}
                                numAttempts={courseData.quizAttempts}
                                maxAttempts={courseData.quiz.maxAttempts}
                                numQuestions={courseData.quiz.numQuestions}
                                totalMarks={courseData.quiz.totalMarks}
                                minimumScore={courseData.quiz.minScore}
                                quizStarted={quizStarted()}
                                courseAttemptId={courseAttemptId}
                                quizAttemptId={quizAttemptId}
                                courseStatus={courseData.status}
                                courseId={params.id}
                            />
                        </div>
                    </div>
                }
            </>
        );
    }

    return (
        <main className="flex flex-col h-fit bg-white w-[100%] p-12 rounded-2xl shadow-custom">

            <Link href="/home"
                  className="flex flex-row space-x-2 items-center mb-6 -mt-4 text-lg hover:opacity-60 duration-150">
                <MdArrowBack size="28" className="text-red-800"/>
                <div>Return To My Courses</div>
            </Link>

            {getCourseData.loading && <div>Loading...</div>}
            {getCourseData.error && <div>Error loading course</div>}
            {courseData && renderCourse()}
        </main>
    )
}
