"use client"
import QuizToMark from "@/app/(main)/admin/tools/QuizToMark";
import ManageCourse from "@/app/(main)/admin/tools/ManageCourse";
import LearnerInsight from "@/app/(main)/admin/tools/LearnerInsight";
import CourseInsight from "@/app/(main)/admin/tools/CourseInsight";
import Button from "@/components/Button";
import {useRouter} from "next/navigation";
import { useState } from "react";
import { useAsync } from "react-async-hook";
import { callApi } from "@/config/firebase";

// Temporary data representing all quizzes that need to be marked
const TEMP_COURSES_TO_MARK_DATA = [
    { title: "Quiz on OpenLMS Platform", course: "Course on OpenLMS Platform", learner: "John Doe", id: 1 },
    { title: "Quiz on OpenLMS Platform", course: "Course on OpenLMS Platform", learner: "Jane Doe", id: 2 },
    { title: "Quiz on OpenLMS Platform", course: "Course on OpenLMS Platform", learner: "Jack Doe", id: 3 },
    { title: "Quiz on OpenLMS Platform", course: "Course on OpenLMS Platform", learner: "Jackie Doe", id: 4 },
    { title: "Quiz on OpenLMS Platform", course: "Course on OpenLMS Platform", learner: "Jim Doe", id: 5 }
]

// Temporary data representing all learners
const TEMP_LEARNER_INSIGHT_DATA = [
    { learner: "Learner on OpenLMS Platform", count: 3, id: 10 },
    { learner: "Learner on OpenLMS Platform", count: 4, id: 11 },
    { learner: "Learner on OpenLMS Platform", count: 5, id: 12 },
    { learner: "Learner on OpenLMS Platform", count: 2, id: 13 },
    { learner: "Learner on OpenLMS Platform", count: 6, id: 14 },
    { learner: "Learner on OpenLMS Platform", count: 4, id: 15 },
    { learner: "Learner on OpenLMS Platform", count: 1, id: 16 },
    { learner: "Learner on OpenLMS Platform", count: 7, id: 17 },
    { learner: "Learner on OpenLMS Platform", count: 8, id: 18 },
    { learner: "Learner on OpenLMS Platform", count: 3, id: 19 }
]

// Temporary data representing all courses
const TEMP_COURSE_INSIGHT_DATA = [
    { title: "Available Course on OpenLMS Platform", count: 3, time: 30, score: 60, id: 10 },
    { title: "Available Course on OpenLMS Platform", count: 4, time: 30, score: 60, id: 11 },
    { title: "Available Course on OpenLMS Platform", count: 5, time: 30, score: 60, id: 12 },
    { title: "Available Course on OpenLMS Platform", count: 2, time: 30, score: 60, id: 13 },
    { title: "Available Course on OpenLMS Platform", count: 6, time: 30, score: 60, id: 14 },
    { title: "Available Course on OpenLMS Platform", count: 4, time: 30, score: 60, id: 15 },
    { title: "Available Course on OpenLMS Platform", count: 1, time: 30, score: 60, id: 16 },
    { title: "Available Course on OpenLMS Platform", count: 7, time: 30, score: 60, id: 17 },
    { title: "Available Course on OpenLMS Platform", count: 8, time: 30, score: 60, id: 18 },
    { title: "Available Course on OpenLMS Platform", count: 3, time: 30, score: 60, id: 19 }
]

export default function Tools() {

    const courses = useAsync(callApi('getAvailableCourses'), []);
    const learnerInsights = useAsync(callApi('getUserReports'), []);
    const courseInsights = useAsync(callApi('getCourseReports'), []);

    const router = useRouter();
    const [search, setSearch] = useState("");

    const getCourses = () => {
        if (courses.loading) {
            return <div>Loading...</div>;
        }
        if (courses.error) {
            return <div>Error loading courses</div>;
        }

        // @ts-ignore
        return courses.result.data
            .filter((course: any) => course.name.toLowerCase().includes(search.toLowerCase())
                || course.description.toLowerCase().includes(search.toLowerCase()))
            .map((course: any, key: number) => (
                <ManageCourse
                    key={key}
                    title={course.name}
                    description={course.description}
                    id={course.id}
                />
            ));
    }

    const getLearnerInsights = () => {
        if (learnerInsights.loading) {
            return <div>Loading...</div>;
        }
        if (!learnerInsights.result) {
            return <div>Error loading learner insights</div>;
        }

        return (
            <div className="flex flex-wrap justify-start overflow-y-scroll sm:no-scrollbar">
                <table className="border-collapse w-full">
                    <thead>
                    <tr className="bg-gray-200">
                        <th rowSpan={2} colSpan={1}>
                            Name
                        </th>
                        <th rowSpan={2} colSpan={1}>
                            Email
                        </th>
                        <th rowSpan={1} colSpan={5} className="py-2">
                            Courses
                        </th>
                    </tr>
                    <tr className="bg-gray-200">
                        <th className="py-1">Enrolled</th>
                        <th className="py-1">Started</th>
                        <th className="py-1">Completed</th>
                    </tr>
                    </thead>
                    <tbody>
                    { /* @ts-ignore */}
                    {learnerInsights.result.data.map((learner: any, key: number) => (
                            <LearnerInsight
                                key={key}
                                name={learner.name}
                                email={learner.email}
                                coursesEnrolled={learner.coursesEnrolled}
                                coursesAttempted={learner.coursesAttempted}
                                coursesCompleted={learner.coursesComplete}
                                id={learner.uid}
                            />
                        )
                    )}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <main className="flex-col justify-center items-center pt-14">
            {/* Quizzes to mark section */}
            <div className="flex flex-col h-[60vh] bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-row justify-between items-center mb-2">
                    <div className="flex flex-col">
                        <div className="text-2xl mb-2">Quizzes To Mark</div>
                    </div>
                </div>
                <div className="flex flex-wrap justify-start overflow-y-scroll sm:no-scrollbar">
                    {TEMP_COURSES_TO_MARK_DATA.map((quiz, key) => (
                        <QuizToMark
                            key={key}
                            title={quiz.title}
                            course={quiz.course}
                            learner={quiz.learner}
                            id={quiz.id}
                        />
                    ))}
                </div>
            </div>

            {/* Manage courses section */}
            <div className="flex flex-col h-[60vh] bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-row justify-between items-center mb-2">
                    <div className="flex flex-col">
                        <div className="text-2xl mb-2">Manage Courses</div>
                        <p className="mb-0 mr-2">Click on a course to navigate to course update screen.</p>
                    </div>
                    <div className="flex flex-row justify-end">
                        <Button text="Create a Course" onClick={() => router.push('/home')}/>
                        <input
                            className={"border-4 border-[#9D1939] w-[55%] px-4 py-2 -mt-2 text-xl rounded-2xl ml-4"}
                            type="text"
                            placeholder="Search for a course..."
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap justify-start overflow-y-scroll sm:no-scrollbar">
                    {getCourses()}
                </div>
            </div>

            {/* Learner insights section */}
            <div className="flex flex-col h-[50vh] bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-row justify-end items-center mb-2">
                    <div className="text-2xl mb-2 mr-auto">Learner Insights</div>
                    <Button text="Invite a Learner" onClick={() => router.push('/home')}/>
                    <Button text="Download User Reports" onClick={() => router.push('/home')} style="ml-4"/>
                </div>
                {getLearnerInsights()}
            </div>

            {/* Course insights section */}
            <div className="flex flex-col h-[50vh] bg-white p-16 rounded-2xl shadow-custom">
                <div className="flex flex-row justify-end items-center mb-2">
                    <div className="text-2xl mb-2 mr-auto">Course Insights</div>
                    <Button text="Download Course Reports" onClick={() => router.push('/home')}/>
                </div>
                <div className="flex flex-wrap justify-start overflow-y-scroll sm:no-scrollbar">
                    <table className="border-collapse border w-full">
                        <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Course Name</th>
                            <th className="border p-2">Percentage of Learners Completed</th>
                            <th className="border p-2">Average Completion Time</th>
                            <th className="border p-2">Average Quiz Score</th>
                        </tr>
                        </thead>
                        <tbody>
                        {TEMP_COURSE_INSIGHT_DATA.map((course, key) => (
                            <tr key={course.id} className="border">
                                <td className="border p-2">
                                    <CourseInsight
                                        key={key}
                                        title={course.title}
                                        count={course.count}
                                        time={course.time}
                                        score={course.score}
                                        id={course.id}
                                    />
                                </td>
                                <td className="border p-2">{course.count}/10</td>
                                <td className="border p-2">{course.time} minutes</td>
                                <td className="border p-2">{course.score}%</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    )
}
