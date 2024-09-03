"use client";
import EnrolledCourse from "./EnrolledCourse";
import Button from "@/components/Button";
import { useState } from "react";
import { callAPI } from "@/config/supabase.ts";
import { useAsync } from "react-async-hook";
import { MdArrowBack } from "react-icons/md";
import TextField from "@/components/TextField.tsx";
import AvailableCourse from "@/app/(main)/home/AvailableCourse.tsx";

export default function Home() {

    const getCourseData = useAsync(() => callAPI('get-courses').then(r => setCourseData(r.data)), []);

    const [courseData, setCourseData] = useState<undefined | any[]>(undefined);

    const [filters, setFilters] = useState<number[]>([0, 1, 2, 3, 4]);
    const [search, setSearch] = useState<string | null>(null);

    const enrolledCourses = () => {
        if (getCourseData.loading) {
            return <div>Loading...</div>;
        }
        if (courseData !== undefined && getCourseData.error) {
            return <div>Error loading courses</div>;
        }

        if (courseData.filter((course: any) => course.status !== 1).length === 0) {
            return <div className="text-gray-600 text-center">Enroll in courses to get started!</div>
        }
        const temp_courses = [...courseData.filter((course: any) => filters.includes(course.status-2))]
        if (temp_courses.length % 3 === 2) {
            temp_courses.push({name: "_placeholder", status: "", description: "", id: 0})
            temp_courses.push({name: "_placeholder", status: "", description: "", id: 0})
        } else if (temp_courses.length % 3 === 1) {
            temp_courses.push({name: "_placeholder", status: "", description: "", id: 0})
        }

        return temp_courses.map((course: any, key: number) => {

                let time = "";
                if (course.minTime) {
                    if (course.minTime >= 60) {
                        time += `${Math.floor(course.minTime / 60)}hr `;
                    }
                    if (course.minTime % 60 !== 0) {
                        time += `${course.minTime % 60}min`;
                    }
                    time += " learning ";
                }
                if (course.maxQuizTime) {
                    time += time.length > 0 ? " + " : "";
                    if (course.maxQuizTime >= 60) {
                        time += `${Math.floor(course.maxQuizTime / 60)}hr `;
                    }
                    if (course.maxQuizTime % 60 !== 0) {
                        time += `${course.maxQuizTime % 60}min`;
                    }
                    time += " quiz";
                }

                return (
                    <EnrolledCourse
                        key={key}
                        title={course.name}
                        status={course.status }
                        description={course.description}
                        time={time}
                        id={course.id}
                    />
                );
            });
    }

    const statusValues = [
        "To Do",
        "In Progress",
        "Awaiting Marking",
        "Failed",
        "Completed",
    ]
    const statusColors = {
        0: "#468DF0",
        1: "#EEBD31",
        2: "#0fa9bb",
        3: "#ab0303",
        4: "#47AD63",
    }

    const handleUpdateFilter = (key: number) => {
        const temp = [...filters]
        if (temp.includes(key)) 
            temp.splice(temp.indexOf(key), 1)
        else 
            temp.push(key)
        setFilters(temp)
    }

    const availableCourses = () => {
        if (getCourseData.loading) {
            return <div>Loading...</div>;
        }
        if (courseData !== undefined && getCourseData.error) {
            return <div>Error loading courses</div>;
        }

        return courseData
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

    const renderPage = () => {
        if (search === null) {
            return (
                <div className="flex flex-col bg-white w-full p-12 rounded-2xl shadow-custom">
                    <div className="flex flex-row items-center mb-2">
                        <div className="flex flex-row items-center">
                            <div className="text-lg mr-4">My Enrolled Courses</div>
                            <div className="flex flex-row space-x-2">
                                {statusValues.map((value, key) => (
                                    <button
                                        key={key}
                                        className="border-2 rounded-full px-4 py-1 cursor-pointer"
                                        style={{
                                            // @ts-ignore
                                            borderColor: filters.includes(key) ? statusColors[key] : null,
                                            opacity: filters.includes(key) ? 1 : 0.5,
                                        }}
                                        onClick={() => handleUpdateFilter(key)}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button
                            text="Browse Available Courses"
                            onClick={() => setSearch("")}
                            style="ml-auto"
                        />
                    </div>
                    <div className="flex flex-row flex-wrap justify-between mt-4 overflow-y-scroll sm:no-scrollbar">
                        {enrolledCourses()}
                    </div>
                </div>
            )
        }

        return (
            <div className="flex flex-col w-full h-full bg-white p-12 rounded-2xl shadow-custom">
                <div
                    className="flex flex-row space-x-2 items-center mb-2 -mt-4 text-lg hover:opacity-60 duration-150"
                    onClick={() => setSearch(null)}
                >
                    <MdArrowBack size="28" className="text-red-800"/>
                    <div>Return To My Courses</div>
                </div>
                <div className="flex flex-row items-center">
                    <div className="text-lg mb-4">Available Courses</div>
                    <TextField
                        text={search}
                        onChange={setSearch}
                        placeholder='Search for a course title...'
                        style="mb-4 ml-auto w-1/3"
                    />
                </div>
                <div className="flex flex-col gap-4 justify-between overflow-y-scroll sm:no-scrollbar">
                    {availableCourses()}
                </div>
            </div>
        );
    }

    return (
        <main className="flex w-full justify-center mb-4">
            {renderPage()}
        </main>
    )
}
