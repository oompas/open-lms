"use client";
import EnrolledCourse from "./EnrolledCourse";
import { useState } from "react";
import { callAPI } from "@/helpers/supabase.ts";
import { useAsync } from "react-async-hook";
import { MdArrowBack, MdArrowForward, MdInbox } from "react-icons/md";
import TextField from "@/components/TextField.tsx";
import AvailableCourse from "@/app/(main)/home/AvailableCourse.tsx";
import { IoSchool, IoTimeOutline } from "react-icons/io5";
import { AiOutlineForm } from "react-icons/ai";

enum CourseStatus {
    NOT_ENROLLED = "NOT_ENROLLED",
    ENROLLED = "ENROLLED",
    IN_PROGRESS = "IN_PROGRESS",
    AWAITING_MARKING = "AWAITING_MARKING",
    FAILED = "FAILED",
    COMPLETED = "COMPLETED"
}

export default function Home() {

    const getCourseData = useAsync(() => {
        return callAPI('get-courses')
            .then(r => {
                setCourseData(r.data);
            });
    }, []);

    const [courseData, setCourseData] = useState<undefined | any[]>(undefined);

    const [filters, setFilters] = useState<number[]>(Object.values(CourseStatus).filter(s => s !== "NOT_ENROLLED"));
    const [search, setSearch] = useState<string | null>(null);

    const renderCourses = (isEnrolledView) => {
        if (getCourseData.loading) return <div>Loading...</div>;
        if (courseData && getCourseData.error) return <div>Error loading courses</div>;

        const filteredCourses = courseData.filter((course) =>
            isEnrolledView
                ? course.status !== CourseStatus.NOT_ENROLLED
                : course.status === CourseStatus.NOT_ENROLLED && (
                course.name.toLowerCase().includes(search.toLowerCase()) ||
                course.description.toLowerCase().includes(search.toLowerCase())
            )
        );

        if (isEnrolledView && filteredCourses.length === 0) {
            return (
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center cursor-pointer" onClick={() => setSearch("")}>
                        <IoSchool size={80} className="mx-auto mb-2" />
                        <div className="text-gray-600 text-lg font-semibold italic">
                            Enroll in courses to get started!
                        </div>
                    </div>
                </div>
            );
        }

        if (!isEnrolledView && filteredCourses.length === 0) {
            return (
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center cursor-pointer" onClick={() => setSearch("")}>
                        <MdInbox size={80} className="mx-auto mb-2"/>
                        <div className="text-gray-600 text-lg font-semibold italic">
                            No courses available - check again later!
                        </div>
                    </div>
                </div>
            );
        }

        const formatTime = (minTime, quizMarks) => (
            <div className="flex">
                {minTime && (
                    <div className="flex mr-2">
                        <IoTimeOutline size={18} className="mr-1 mt-[2px]"/>
                        {minTime >= 60 && `${Math.floor(minTime / 60)} hr `}
                        {minTime % 60 !== 0 && `${minTime % 60} min`}
                    </div>
                )}
                {quizMarks && (
                    <div className="flex">
                        <AiOutlineForm size={18} className="mr-1 mt-[2px]" />
                        {quizMarks + " Marks"}
                    </div>
                )}
            </div>
        );

        const CourseComponent = isEnrolledView ? EnrolledCourse : AvailableCourse;

        return (
            <div className="flex flex-row flex-wrap gap-x-4 mt-4 overflow-y-scroll sm:no-scrollbar">
                {filteredCourses.map((course, key) => (
                    <CourseComponent
                        key={key}
                        title={course.name}
                        description={course.description}
                        id={course.id}
                        status={isEnrolledView ? course.status : undefined}
                        time={formatTime(course.minTime, course.total_quiz_marks)}
                    />
                ))}
            </div>
        );
    };

    const statusColors = {
        ENROLLED: "#468DF0",
        IN_PROGRESS: "#EEBD31",
        AWAITING_MARKING: "#0fa9bb",
        FAILED: "#ab0303",
        COMPLETED: "#47AD63",
    }

    const handleUpdateFilter = (key: string) => {
        const temp = [...filters]
        if (temp.includes(key)) {
            temp.splice(temp.indexOf(key), 1);
        } else {
            temp.push(key);
        }
        setFilters(temp);
    }

    const renderPage = () => {
        // My enrolled courses page
        if (search === null) {
            return (
                <div className="flex flex-col bg-white w-full p-12 rounded-2xl shadow-custom">
                    <div className="flex flex-row items-center mb-6">
                        <div className="text-xl mr-4 font-medium">My Enrolled Courses</div>
                        <div
                            className="flex space-x-2 items-center text-lg hover:opacity-60 duration-150 ml-auto"
                            onClick={() => setSearch("")}
                        >
                            <div>Find Courses</div>
                            <MdArrowForward size="28" className="text-red-800"/>
                        </div>
                    </div>


                    <div className="flex flex-row items-center mb-2">
                        <div className="flex flex-row items-center">
                            <div className="text-lg mr-4">Filters:</div>
                            <div className="flex flex-row space-x-2">
                                {Object.values(CourseStatus).filter(s => s !== "NOT_ENROLLED").map((value, key) => (
                                    <button
                                        key={key}
                                        className="border-2 rounded-full px-4 py-1 cursor-pointer"
                                        style={{
                                            borderColor: filters.includes(value) ? statusColors[value] : null,
                                            opacity: filters.includes(value) ? 1 : 0.5,
                                        }}
                                        onClick={() => handleUpdateFilter(value)}
                                    >
                                        {value.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {renderCourses(true)}
                </div>
            )
        }

        // Available courses page
        return (
            <div className="flex flex-col w-full h-full bg-white p-12 rounded-2xl shadow-custom">
                <div className="max-w-xs">
                    <div
                        className="flex space-x-2 items-center mb-2 -mt-4 text-lg hover:opacity-60 duration-150"
                        onClick={() => setSearch(null)}
                    >
                        <MdArrowBack size="28" className="text-red-800"/>
                        <div>Return To My Courses</div>
                    </div>
                </div>

                <div className="flex flex-row items-center">
                    <div className="text-xl font-medium mb-4">Available Courses</div>
                    <TextField
                        text={search}
                        onChange={setSearch}
                        placeholder='Search by name or description...'
                        style="mb-4 ml-auto w-1/3"
                    />
                </div>

                {renderCourses(false)}
            </div>
        );
    }

    return (
        <div className="flex w-full h-full pb-2 bg-gray-100">
            <div className="flex w-[100%]">
                {renderPage()}
            </div>
        </div>
    )
}
