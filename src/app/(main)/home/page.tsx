"use client";
import SearchBar from "@/components/SearchBar";
import AvailableCourse from "./AvailableCourse";
import EnrolledCourse from "./EnrolledCourse";
import { useAsync } from 'react-async-hook';
import { getFunctions, httpsCallable } from "firebase/functions";
import "../../../config/firebase";

export default function Home() {

    const courses = useAsync(httpsCallable(getFunctions(), 'getAvailableCourses'), []);
    if (courses.loading) {
        return <div>Loading...</div>;
    }
    if (courses.error) {
        return <div>Error: {courses.error.message}</div>;
    }
    console.log(JSON.stringify(courses.result, null, 4));

    const TEMP_ENROLLED_COURSE_DATA = [
        { title: "Dog-Walker Health & Safety Training", status: "Todo", description: "Example course description briefly describing the course contents.", time: "1h 25m", color: "#468DF0", id: 1 },
        { title: "Toddler Potty Training Intensive", status: "In Progress", description: "Example course description briefly describing the course contents.", time: "8h", color: "#EEBD31", id: 2 },
        { title: "Astronaut WHIMIS Certification ", status: "In Progress", description: "Example course description briefly describing the course contents.", time: "15m", color: "#EEBD31", id: 3 },
        { title: "The Dictionary 101 ", status: "Complete", description: "Example course description briefly describing the course contents.", time: "15m", color: "#47AD63", id: 4 },
        { title: "ABCs for Beginners ", status: "Complete", description: "Example course description briefly describing the course contents.", time: "15m", color: "#47AD63", id: 5 }
    ]

    const TEMP_AVAIL_COURSE_DATA = [
        { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 10 },
        { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 11 },
        { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 12 },
        { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 13 },
        { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 14 },
        { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 15 },
        { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 16 },
        { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 17 },
        { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 18 },
        { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 19 }
    ]

    return (
        <main className="flex justify-center pt-14">
            <div className="flex flex-col h-[80vh] bg-white w-[60%] p-16 rounded-2xl shadow-custom">
                <div className="text-2xl mb-8">My Enrolled Courses</div>
                <div className="flex flex-row flex-wrap justify-between overflow-y-scroll sm:no-scrollbar">
                    { TEMP_ENROLLED_COURSE_DATA.map((course, key) => (
                        <EnrolledCourse 
                            key={key}
                            title={course.title}
                            status={course.status}
                            description={course.description}
                            time={course.time}
                            color={course.color}
                            id={course.id}
                        />
                    ))}
                </div>
            </div>
            <div className="flex flex-col h-[80vh] bg-white w-[35%] ml-[5%] p-16 rounded-2xl shadow-custom">
                <div className="flex flex-row mb-8">
                    <div className="text-2xl mr-auto">Available Courses</div>
                    <SearchBar />
                </div>
                <div className="flex flex-col justify-between overflow-y-scroll sm:no-scrollbar">
                    { TEMP_AVAIL_COURSE_DATA.map((course, key) => (
                        <AvailableCourse 
                            key={key}
                            title={course.title}
                            description={course.description}
                            id={course.id}
                        />
                    ))}
                </div>
            </div>
        </main>
    )
}
