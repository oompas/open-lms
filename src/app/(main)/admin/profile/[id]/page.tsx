"use client"

import IDProfile from "./IDProfile";
import IDCourse from "./IDCourse";
import IDCoursesEnrolled from "./IDEnrolled"
import { useState } from "react";
import { callApi } from "@/config/firebase";
import { useAsync } from "react-async-hook";
import Link from "next/link";
import { LuExternalLink } from "react-icons/lu";


export default function Profile({ params }: { params: { id: string } }) {

    const userData = useAsync(() =>
        callApi('getUserProfile', { targetUid: params.id }) // @ts-ignore
            .then((rsp) => { setUser(rsp.data); return rsp; }),
        []);

    const [user, setUser] = useState()

    const profileData = () => {
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
                />
            )
        }
    }

    const coursesEnrolledData = () => {
        if (user) {
            // @ts-ignore
            return user.enrolledCourses.map((course, key) => (
                <IDCourse
                    key={key}
                    title={course.name}
                    id={course.id}
                />
            ))
        }
    }

    const courseData = () => {
        if (user) {
            // @ts-ignore
            return user.completedCourses.map((coursesEnrolled, key) => (
                <IDCoursesEnrolled 
                    key={key}
                    title={coursesEnrolled.name}
                    completionDate={new Date(coursesEnrolled.date).toLocaleString()}
                />
            ))
        }
    }

    const quizAttempts = () => {
        if (user) {
            // @ts-ignore
            return user.quizAttempts.map((quiz, key) => (
                <tr className="border">
                    <td className="border p-2">
                        <Link href={"/admin/mark/"+quiz.id} className="flex flex-row items-center hover:opacity-60">
                            {new Date(quiz.endTime).toLocaleString()}
                            <LuExternalLink className="ml-1" color="rgb(153 27 27)"/>
                        </Link>
                    </td>
                    <td className="border p-2">{quiz.courseId}</td>
                    <td className="border p-2">unmarked</td>
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
                    <div className="text-lg mb-2">
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
                        { profileData() }
                    </div>

                    <div className="flex flex-col h-[50vh] bg-white w-[50%] p-12 rounded-2xl shadow-custom overflow-y-scroll sm:no-scrollbar">
                        {/* Completed Courses section */}
                        <div className="text-lg mb-4">Completed Courses</div>
                        <div className="flex flex-col mr-auto text-lg w-[100%]">
                            <table className="flex-col border-collapse border w-full">
                                <thead>
                                    <tr className="bg-gray-200 text-left">
                                        <th className="border p-2">Name</th>
                                        <th className="border p-2">Date of Completion</th>
                                    </tr>
                                </thead>
                                { courseData() }
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
                <div className="flex flex-row justify-end items-center mb-4">
                    <div className="text-lg mb-2 mr-auto">Quiz Attempts</div>
                </div>
                <div className="max-h-full overflow-y-scroll sm:no-scrollbar">
                    <table className="border w-full sm:no-scrollbar">
                        <thead>
                            <tr className="bg-gray-200 text-left">
                                <th className="border p-2">Submission Date</th>
                                <th className="border p-2">Course Name</th>
                                <th className="border p-2">Mark</th>
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
