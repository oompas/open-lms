"use client";
import EnrolledCourse from "./EnrolledCourse";
import Notifications from "./Notifications"
import { useAsync } from 'react-async-hook';
import { getFunctions, httpsCallable } from "firebase/functions";
import "../../../config/firebase";
import { useState } from "react";
import Link from "next/link"

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
                    time={(course.minQuizTime >= 3600 ? Math.floor(course.minQuizTime / 3600) + "h " : "") + Math.floor(course.minQuizTime / 60) % 60 + "m"}
                    color={(course.status === 2 ? "#468DF0" : (course.status === 3 || course.status === 4 ? "#EEBD31" : "#47AD63"))}
                    id={course.id}
                />
            ));
    }

    return (
        <main className="flex justify-center pt-14">
            <div className="flex flex-col bg-white w-[100%] p-16 rounded-2xl shadow-custom">
                <div className="text-4xl mb-8">My Enrolled Courses</div>
                <div className="flex flex-row flex-wrap justify-between overflow-y-scroll sm:no-scrollbar">
                    {enrolledCourses()}
                </div>
            </div>
            <div className="flex-col justify-center w-[60%] items-center">
                <div className="flex flex-col mb-10 bg-white p-10 ml-10 rounded-2xl shadow-custom">
                    <div className="text-2xl mb-10">Browse Available Courses</div>
                    <div className="text-l mb-5">Looking for a course?</div>
                    <div className="text-l mb-10">Find and enroll in a course below.</div>
                    <Link className="bg-[#4050FF] text-white mb-4 p-4 font-bold rounded-2xl cursor-pointer hover:opacity-60 duration-100" href={`/course_search`}>
                        <div className="text-l text-center">Browse Now</div>
                    </Link>
                </div>
                {notificationData()}
            </div>
        </main>
    )
}
