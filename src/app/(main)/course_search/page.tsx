"use client";
import { useAsync } from 'react-async-hook';
import AvailableCourse from "./AvailableCourse";
import { getFunctions, httpsCallable } from "firebase/functions";
import "../../../config/firebase";
import { useState } from "react";

export default function Home() {

    const courses = useAsync(httpsCallable(getFunctions(), 'getAvailableCourses'), []);
    const [search, setSearch] = useState("");

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
            <div className="flex flex-col w-[100%] h-[100vh] bg-white p-16 rounded-2xl shadow-custom">
                <div className="flex flex-col mb-10">
                    <input
                        className={"border-4 border-[#9D1939] w-[100%] px-4 py-2 mt-2 text-6xl mb-10 rounded-2xl"}
                        type="text"
                        placeholder=" Search for a course..."
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="text-4xl mb-10">Available Courses</div>
                <div className="flex flex-col justify-between overflow-y-scroll">
                    {availableCourses()}
                </div>
            </div>
        </main>
    )
}