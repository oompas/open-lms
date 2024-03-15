"use client";
import EnrolledCourse from "./EnrolledCourse";
import Notifications from "./Notifications"
import { useAsync } from 'react-async-hook';
import { getFunctions, httpsCallable } from "firebase/functions";
import "../../../config/firebase";
import { useState } from "react";
import Link from "next/link"
import TextField from "@/components/TextField";

export default function Home() {

    const courses = useAsync(httpsCallable(getFunctions(), 'getAvailableCourses'), []);
    const [search, setSearch] = useState("");

    const TEMP_NOTIFICATION_DATA = [
        { title: "CISC 423", description: "Jan 1, 2023", urgency: "URGENT", link: "no", id: 1 },
    ]

    const notificationData = () => {
        return (
            <>
                {TEMP_NOTIFICATION_DATA.map((notification,key) => (
                    <Notifications
                        key={key}
                        title={notification.title}
                        description={notification.description}
                        urgency={notification.urgency}
                        link={notification.link}
                        id={notification.id}
                    />
                ))}
            </>
        )
    }

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

    return (
        <main className="flex justify-center pt-14">
            <div className="flex flex-col bg-white w-[100%] p-16 rounded-2xl shadow-custom">
                <div className="flex flex-row items-center mb-2">
                    <div className="text-lg">My Enrolled Courses</div>
                    <Link className="bg-red-800 ml-auto text-white p-4 font-bold rounded-2xl cursor-pointer hover:opacity-60 duration-100" href={`/course_search`}>
                        <div className="text-l text-center">Browse Available Courses</div>
                    </Link>
                </div>
                <div className="flex flex-row flex-wrap justify-between overflow-y-scroll sm:no-scrollbar">
                    {enrolledCourses()}
                </div>
            </div>
        </main>
    )
}
