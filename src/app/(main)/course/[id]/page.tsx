"use client";
import Link from "next/link";
import IDCourse from "./IDCourse";
import Quiz from "./Quiz"
import { MdArrowBack } from "react-icons/md";
import { useEffect, useState } from "react";
import Checkbox from "@/components/Checkbox";
import { useAsync } from "react-async-hook";
import { callAPI } from "@/helpers/supabase.ts";

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
            setCourseAttemptId(r.data.courseAttempt.currentAttemptId);

            if (r.data.courseAttempt.currentStartTime
                && new Date().getTime() > new Date(r.data.courseAttempt.currentStartTime).getTime() + r.data.minTime * 60 * 1000) {
                setTimeDone(true);
            }
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
        if (!courseData) {
            return <></>;
        }

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
                    quizStarted={quizStarted()}
                    courseAttemptId={courseAttemptId}
                    quizAttemptId={quizAttemptId}
                    courseId={params.id}
                />

                <div className="mt-8 text-2xl">
                    <h1 className="mb-4">Course requirements:</h1>
                    {courseData.minTime &&
                        <div className="flex flex-row items-center mt-2">
                            <Checkbox checked={timeDone} setChecked={null} style="mr-3"/>
                            <div>{`Spend at least ${getCourseTimeString()} on the course`}</div>
                        </div>
                    }
                    {courseData.quizData &&
                        <div className="flex flex-row items-center mt-2">
                            <Checkbox
                                checked={courseData.status === CourseStatus.COMPLETED ? true : (courseData.status === CourseStatus.FAILED ? null: false)}
                                setChecked={null}
                                style="mr-3"
                            />
                            <div>{"Pass the quiz"}</div>
                        </div>
                    }
                </div>

                { courseData.quizData &&
                    <div className="mt-4">
                        <div className="flex flex-col w-fit">
                            <Quiz
                                key={1}
                                length={courseData.quizData.timeLimit}
                                numAttempts={courseData.quizAttempts.number}
                                maxAttempts={courseData.quizData.maxAttempts}
                                numQuestions={courseData.quizData.numQuestions}
                                totalMarks={courseData.quizData.totalMarks}
                                minimumScore={courseData.quizData.minScore}
                                courseStatus={courseData.status}
                            />
                        </div>
                    </div>
                }
            </>
        );
    }

    const loadingPopup = () => {
        if (courseData) {
            return <></>;
        }

        return (
            <div
                className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
                <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                    <div className="text-lg">
                        {getCourseData.loading ? "Loading course data..." : "Error loading user data."}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-full pb-2">
            <div className="w-[100%] bg-white p-14 rounded-2xl shadow-custom">
                <Link href="/home"
                      className="flex flex-row space-x-2 items-center mb-6 -mt-4 text-lg hover:opacity-60 duration-150">
                    <MdArrowBack size="28" className="text-red-800"/>
                    <div>Return To My Courses</div>
                </Link>

                {renderCourse()}
                {loadingPopup()}
            </div>
        </div>
    )
}
