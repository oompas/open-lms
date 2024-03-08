"use client";
import AvailableCourse from "./AvailableCourse";
import EnrolledCourse from "./EnrolledCourse";
import { useAsync } from 'react-async-hook';
import { getFunctions, httpsCallable } from "firebase/functions";
import "../../../config/firebase";
import { useState } from "react";

export default function Home() {

    const courses = useAsync(httpsCallable(getFunctions(), 'getAvailableCourses'), []);
    const [search, setSearch] = useState("");

    const enrolledCourses = () => {
        if (courses.loading) {
            return <div>Loading...</div>;
        }
        if (courses.error) {
            return <div>Error loading courses</div>;
        }

        // @ts-ignore
        return courses.result.data
            .filter((course: any) => course.status !== 1)
            .map((course: any, key: number) => (
                <EnrolledCourse
                    key={key}
                    title={course.name}
                    status={course.status}
                    description={course.description}
                    time={(course.minQuizTime >= 60 ? Math.floor(course.minQuizTime / 60) + "h " : "") + course.minQuizTime % 60 + "m"}
                    color={(course.status === 2 ? "#468DF0" : (course.status === 3 || course.status === 4 ? "#EEBD31" : "#47AD63"))}
                    id={course.id}
                />
            ));
    }

    const availableCourses = () => {
        if (courses.loading) {
            return <div>Loading...</div>;
        }
        if (courses.error) {
            return <div>Error loading courses</div>;
        }

        // @ts-ignore
        return courses.result.data
            .filter((course: any) => course.status === 1 && (course.name.toLowerCase().includes(search.toLowerCase())
                    || course.description.toLowerCase().includes(search.toLowerCase())))
            .map((course: any, key: number) => (
                <AvailableCourse
                    key={key}
                    title={course.name}
                    description={course.description}
                    id={course.id}
                />
            ));
    }

    return (
        <main className="flex justify-center pt-14">
            <div className="flex flex-col h-[80vh] bg-white w-[60%] p-16 rounded-2xl shadow-custom">
                <div className="text-2xl mb-8">My Enrolled Courses</div>
                <div className="flex flex-row flex-wrap justify-between overflow-y-scroll sm:no-scrollbar">
                    {enrolledCourses()}
                </div>
            </div>
            <div className="flex flex-col h-[80vh] bg-white w-[35%] ml-[5%] p-16 rounded-2xl shadow-custom">
                <div className="flex flex-row mb-8">
                    <div className="text-2xl mr-auto">Available Courses</div>
                    <input
                        className={"border-4 border-[#9D1939] w-[55%] px-4 py-2 -mt-2 text-xl rounded-2xl"}
                        type="text"
                        placeholder="Search for a course..."
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex flex-col justify-between overflow-y-scroll sm:no-scrollbar">
                    {availableCourses()}
                </div>
            </div>
        </main>
    )
}
