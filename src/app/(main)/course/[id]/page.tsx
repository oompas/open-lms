"use client";
import Link from "next/link";
import IDCourse from "./IDCourse";
import Quiz from "./Quiz"
import { MdArrowBack } from "react-icons/md";
import { useEffect, useState } from "react";
import Checkbox from "@/components/Checkbox";
import { useAsync } from "react-async-hook";
import { callAPI } from "@/config/supabase.ts";

export default function Course({ params }: { params: { id: string } }) {

    const getCourseData = useAsync(() => callAPI('get-course-data', { id: params.id })
        .then(r => setCourseData(r.data)), []);
    
    // const getCourse = useAsyncApiCall(ApiEndpoints.GetCourseInfo, { courseId: params.id, withQuiz: false },
    //     (result) => {
    //         setStatus(result.data.status);
    //         setCourseAttemptId(result.data.courseAttemptId);
    //         if (result.data.currentQuiz) {
    //             setQuizAttemptId(result.data.currentQuiz.id);
    //         }
    //         return result;
    //     });

    const [courseData, setCourseData] = useState<undefined | object>(undefined);

    const [status, setStatus] = useState(0);
    const [timeDone, setTimeDone] = useState(false);
    const [courseAttemptId, setCourseAttemptId] = useState(null);
    const [quizAttemptId, setQuizAttemptId] = useState(null);
    const [quizStarted, setQuizStarted] = useState<null|boolean>(null);

    useEffect(() => {
        if (!getCourseData.result?.data) {
            return;
        }

        setQuizStarted(status <= 2 || status === 6 || !timeDone
            ? null // @ts-ignore
            : getCourseData.result.data.currentQuiz !== null);

    }, [status, timeDone]);

    const renderCourse = () => {
        // @ts-ignore
        const course: any = getCourseData.result.data;

        const getCourseTimeString = () => {
            if (course.minTime < 60) {
                return course.minTime + " minute" + (course.minTime === 1 ? "" : "s");
            }
            return Math.floor(course.minTime / 60) + " hour" + (Math.floor(course.minTime / 60) > 1 ? "s" : "")
                + (course.minTime % 60 > 0 ? " and " + course.minTime % 60 + " minute" + (course.minTime % 60 === 1 ? "" : "s") : "");
        }

        return (
            <>
                <IDCourse
                    course={course}
                    timeDone={timeDone}
                    setTimeDone={setTimeDone}
                    status={status}
                    setStatus={setStatus}
                    setCourseAttemptId={setCourseAttemptId}
                />

                <div className="mt-8 text-2xl">
                    <h1 className="mb-4">To complete the course:</h1>
                    {course.minTime &&
                        <div className="flex flex-row items-center mt-2">
                            <Checkbox checked={timeDone} setChecked={null} style="mr-3"/>
                            <div>{`Spend at least ${getCourseTimeString()} on the course`}</div>
                        </div>
                    }
                    {course.quiz &&
                        <div className="flex flex-row items-center mt-2">
                            <Checkbox checked={course.status === 6} setChecked={null} style="mr-3"/>
                            <div>{"Pass the quiz"}</div>
                        </div>
                    }
                </div>

                { course.quiz &&
                    <div className="mt-4">
                        <div className="flex flex-col w-fit">
                            <Quiz
                                key={1}
                                length={course.quiz.timeLimit}
                                numAttempts={course.quizAttempts}
                                maxAttempts={course.quiz.maxAttempts}
                                numQuestions={course.quiz.numQuestions}
                                totalMarks={course.quiz.totalMarks}
                                minimumScore={course.quiz.minScore}
                                quizStarted={quizStarted}
                                courseAttemptId={courseAttemptId}
                                quizAttemptId={quizAttemptId}
                                courseStatus={course.status}
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
            {getCourseData.result && renderCourse()}
        </main>
    )
}
