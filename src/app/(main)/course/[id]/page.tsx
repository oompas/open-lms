"use client";
import Link from "next/link";
import IDCourse from "./IDCourse";
import Quiz from "./Quiz"
import Requirement from "./Requirement";
import { MdArrowBack } from "react-icons/md";
import { useAsync } from "react-async-hook";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function Course({ params }: { params: { id: string } }) {

    const getCourseInfo = (id: string) => httpsCallable(getFunctions(),"getCourseInfo")({ courseId: id });
    const getCourse = useAsync(getCourseInfo, [params.id]);

    const renderCourse = () => {
        // @ts-ignore
        const course: any = getCourse.result.data;
        console.log(JSON.stringify(course, null, 4));

        return (
            <>
                <IDCourse
                    title={course.name}
                    courseStatus={course.status}
                    description={course.description}
                    minTime={course.minTime}
                    startTime={course.startTime}
                    link={course.link}
                    id={course.courseId}
                />

                <div className="mt-8 text-2xl">
                    <h1 className="mb-4">Required completion verification:</h1>
                    <Requirement key={1} text={"Spend at least 15mins on the course"} done={true}/>
                    <Requirement key={2} text={"Complete the required quiz"} done={false}/>
                </div>

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
            </>
        );
    }

    return (
        <main className="mt-14 flex flex-col h-fit bg-white w-[100%] p-16 rounded-2xl shadow-custom">

            <Link href="/home" className="flex flex-row space-x-2 items-center mb-6 -mt-8 text-lg hover:opacity-60 duration-150">
                <MdArrowBack size="28" className="text-red-800"/>
                <div>return to my courses</div>
            </Link>

            {getCourse.loading && <div>Loading...</div>}
            {getCourse.error && <div>Error loading course</div>}
            {getCourse.result && renderCourse()}
        </main>
    )
}
