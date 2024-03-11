"use client";
import Link from "next/link";
import IDCourse from "./IDCourse";
import Quiz from "./Quiz"
import Requirement from "./Requirement";
import { MdArrowBack } from "react-icons/md";
import { useAsync } from "react-async-hook";
import { useState } from "react";
import { callApi } from "@/config/firebase";

export default function Course({ params }: { params: { id: string } }) {

    const getCourse = useAsync(() => callApi("getCourseInfo")({ courseId: params.id, withQuiz: false }), []);

    const [timeDone, setTimeDone] = useState(false);

    const renderCourse = () => {
        // @ts-ignore
        const course: any = getCourse.result.data;

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
                />

                <div className="mt-8 text-2xl">
                    <h1 className="mb-4">Required completion verification:</h1>
                    {course.minTime && <Requirement key={1} text={`Spend at least ${getCourseTimeString()} on the course`} done={timeDone}/>}
                    {course.quiz && <Requirement key={2} text={"Complete the required quiz"} done={false}/>}
                </div>

                {course.quiz &&
                    <div className="mt-4">
                        <div className="flex flex-col w-1/2">
                            <Quiz
                                key={1}
                                length={course.quizTimeLimit + " minutes"}
                                attempts={course.maxQuizAttempts}
                                id={1}
                            />
                        </div>
                    </div>
                }
            </>
        );
    }

    return (
        <main className="mt-14 flex flex-col h-fit bg-white w-[100%] p-16 rounded-2xl shadow-custom">

            <Link href="/home"
                  className="flex flex-row space-x-2 items-center mb-6 -mt-8 text-lg hover:opacity-60 duration-150">
                <MdArrowBack size="28" className="text-red-800"/>
                <div>return to my courses</div>
            </Link>

            {getCourse.loading && <div>Loading...</div>}
            {getCourse.error && <div>Error loading course</div>}
            {getCourse.result && renderCourse()}
        </main>
    )
}
