"use client";
import AvailableCourse from "./AvailableCourse";
import EnrolledCourse from "./EnrolledCourse";
import { useAsync } from 'react-async-hook';
import { getFunctions, httpsCallable } from "firebase/functions";
import "../../../config/firebase";
import { useState } from "react";
import TextField from "@/components/TextField";

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
        <main className="flex justify-center w-full h-full pb-[2vh]">
            <div className="flex flex-col h-full bg-white w-[60%] p-12 rounded-2xl shadow-custom">
                <div className="text-lg mb-4">My Enrolled Courses</div>
                <div className="flex flex-row flex-wrap justify-between overflow-y-scroll sm:no-scrollbar">
                    {enrolledCourses()}
                </div>
            </div>
            <div className="flex flex-col bg-white w-[38%] ml-[2%] p-12 rounded-2xl shadow-custom">
                <div className="flex flex-col mb-6">
                    <div className="text-lg mr-auto mb-2">Available Courses</div>
                    <TextField 
                        placeholder="Search for a title..."
                        text={search}
                        onChange={setSearch}
                    />
                </div>
                <div className="flex flex-col justify-between overflow-y-scroll sm:no-scrollbar">
                    {availableCourses()}
                </div>
            </div>
        </main>
    )
}
