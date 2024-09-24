"use client"
import IDProfile from "./IDProfile";
import IDCourse from "./IDCourse";
import IDEnrolled from "./IDEnrolled"
import { useState } from "react";
import Link from "next/link";
import { LuExternalLink } from "react-icons/lu";
import StatusBadge from "@/components/StatusBadge";
import { useAsync } from "react-async-hook";
import { callAPI } from "@/config/supabase.ts";


export default function Profile({ params }: { params: { id: string } }) {

    const userData = useAsync(() => callAPI('get-user-profile'));

    const [status, setStatus] = useState("");

    const profileData = () => {
        const user = userData?.result?.data;
        if (user) {

            const unixToString = (unix: number) => {
                if (unix === -1) {
                    return "Never";
                }

                return new Date(unix).toDateString() + ", " + new Date(unix).toLocaleTimeString();
            }

            return (
                <IDProfile
                    // @ts-ignore
                    name={user.name}
                    // @ts-ignore
                    signUpDate={unixToString(user.signUpDate)}
                    // @ts-ignore
                    lastLoginDate={unixToString(user.lastSignIn)}
                    // @ts-ignore
                    email={user.email}
                    uid={params.id}
                    // @ts-ignore
                    disabled={user.disabled}
                />
            )
        }
    }

    const coursesEnrolledData = () => {
        const user = userData?.result?.data;
        if (user) {
            // @ts-ignore
            const temp_courses = [...user.enrolledCourses]
            if ( temp_courses.length % 4 == 1 ) {
                temp_courses.push({"name": "_placeholder", "id": 0})
                temp_courses.push({"name": "_placeholder", "id": 0})
                temp_courses.push({"name": "_placeholder", "id": 0})
            } else if ( temp_courses.length % 4 == 2 ) {
                temp_courses.push({"name": "_placeholder", "id": 0})
                temp_courses.push({"name": "_placeholder", "id": 0})
            } else if ( temp_courses.length % 4 == 3 ) {
                temp_courses.push({"name": "_placeholder", "id": 0})
            }
            return temp_courses.map((course, key) => (
                <IDCourse
                    key={key}
                    title={course.name}
                    id={course.id}
                />
            ))
        }
    }

    const courseCompletedData = () => {
        const user = userData?.result?.data;
        if (user) {
            // @ts-ignore
            return user.completedCourses.map((coursesEnrolled, key) => (
                <IDEnrolled 
                    key={key}
                    title={coursesEnrolled.name}
                    completionDate={new Date(coursesEnrolled.date*1000).toLocaleString()}
                />
            ))
        }
    }

    const quizAttempts = () => {
        const user = userData?.result?.data;
        if (user) {
            // @ts-ignore
            return user.quizAttempts.map((quiz, key) => (
                <tr className="border">
                    <td className="border p-2">
                        <Link href={"/admin/mark/"+quiz.id} className="flex flex-row items-center hover:opacity-60">
                            {new Date(quiz.endTime*1000).toLocaleString()}
                            <LuExternalLink className="ml-1" color="rgb(153 27 27)"/>
                        </Link>
                    </td>
                    <td className="border p-2">
                        <Link href={"/admin/course/"+quiz.courseId+"/insights"} className="flex flex-row items-center hover:opacity-60">
                            {quiz.courseName}
                            <LuExternalLink className="ml-1" color="rgb(153 27 27)"/>
                        </Link>
                    </td>
                    <td className="border p-2">{quiz.score ? quiz.score : "Unmarked"}</td>
                </tr>
            ))
        }
    }

    const loadingPopup = () => {
        if (userData.result?.data) {
            return <></>;
        }

        return (
            <div
                className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
                <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                    <div className="text-lg">
                        {userData.loading ? "Loading user data..." : "Error loading user data."}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="flex flex-col w-full h-full overflow-y-scroll sm:no-scrollbar mb-4">

            <div className="flex flex-row w-full mb-4">
                    {/* Account Details section */}
                    <div className="flex flex-col bg-white w-[50%] h-[50vh] p-12 rounded-2xl shadow-custom mr-8 overflow-y-scroll sm:no-scrollbar">
                        <div className="text-lg mb-2">Account Details</div>
                        {status && <StatusBadge status={status} style="mt-2" />}
                        { profileData() }
                    </div>

                    <div className="flex flex-col h-[50vh] bg-white w-[50%] p-12 rounded-2xl shadow-custom overflow-y-scroll sm:no-scrollbar">
                        {/* Completed Courses section */}
                        <div className="text-lg mb-4">Completed Courses</div>
                        <div className="flex flex-col mr-auto text-lg w-[100%]">
                            <table className="flex-col border-collapse w-full">
                                <thead>
                                    <tr className="border-b-2 border-black text-left">
                                        <th className="p-2">Name</th>
                                        <th className="p-2">Date of Completion</th>
                                    </tr>
                                </thead>
                                { courseCompletedData() }
                            </table>
                        </div>
                    </div>
            </div>

            {/* Enrolled Courses Section */}
            <div className="flex flex-col h-[60vh] bg-white p-12 rounded-2xl shadow-custom mb-4">
                <div className="flex flex-row justify-end items-center mb-4">
                    <div className="text-lg mb-2 mr-auto">Enrolled Courses</div>
                </div>
                <div className="flex flex-row w-full flex-wrap justify-between gap-y-4 overflow-y-scroll sm:no-scrollbar">
                    {coursesEnrolledData()} 
                </div>
            </div>

            {/* Quiz Attempts Section */}
            <div className="flex flex-col max-h-full bg-white p-12 rounded-2xl shadow-custom mb-4">
                <div className="flex flex-row justify-end items-center mb-2">
                    <div className="text-lg mr-auto">Quiz Attempts</div>
                </div>
                <div className="max-h-full overflow-y-scroll sm:no-scrollbar">
                    <table className="w-full sm:no-scrollbar">
                        <thead>
                            <tr className="border-b-2 border-black text-left">
                                <th className="p-2">Submission Date</th>
                                <th className="p-2">Course Name</th>
                                <th className="p-2">Mark</th>
                            </tr>
                        </thead>
                        <tbody>
                            { quizAttempts() }
                        </tbody>
                    </table>
                </div>
            </div>

            { loadingPopup() }

        </main>  
    );
}
