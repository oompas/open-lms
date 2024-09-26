"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CompletedCourse from "./CompletedCourse";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import { callAPI, signOut } from "@/config/supabase.ts";
import { useAsync } from "react-async-hook";
import { MdArrowBack } from "react-icons/md";
import Link from "next/link";

export default function Profile() {

    const getUserData = useAsync(() => callAPI('get-profile').then(r => setUser(r.data)), {});

    const [user, setUser] = useState(undefined);

    // const unixToString = (unix: number) => {
    //     if (unix === -1) {
    //         return "Never";
    //     }
    //
    //     return new Date(unix).toDateString() + ", " + new Date(unix).toLocaleTimeString();
    // }

    const logout = async () => {
        await signOut();
    }

    const loadingPopup = () => {
        if (user) {
            return <></>;
        }

        return (
            <div
                className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
                <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                    <div className="text-lg">
                        {getUserData.loading ? "Loading user data..." : "Error loading user data."}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="flex w-full h-full pb-[2vh]">
            <div className={`flex flex-col h-[80vh] bg-white w-[60%] p-12 rounded-2xl shadow-custom`}>
                <Link href="/home"
                      className="flex flex-row space-x-2 items-center mb-6 -mt-4 italic hover:opacity-60 duration-150">
                    <MdArrowBack size="24" className="text-red-800"/>
                    <div>Return To Courses</div>
                </Link>

                <div className="text-lg mb-4">Your Account Details</div>
                <div className="flex flex-col h-full">
                    {user?.role && <StatusBadge status={user?.role} style="my-1"/>}
                    <div className="text-2xl font-bold mt-2">{user?.name}</div>
                    <div className="mr-auto text-lg mb-4">{user?.email}</div>
                    <div className="flex flex-col h-full items-end mb-auto">
                        <div className="mr-auto text-lg">Joined: <i>{user?.signUpDate}</i></div>
                    </div>

                    <Button text="Log Out" onClick={async () => await logout()}/>
                </div>
            </div>
            <div className="flex flex-col h-[80vh] bg-white w-[38%] ml-[2%] p-12 rounded-2xl shadow-custom">
                <div className="flex flex-row mb-4">
                    <div className="text-lg mr-auto">Completed Courses</div>
                </div>
                <div className="flex flex-col justify-between overflow-y-scroll sm:no-scrollbar">
                    {/* @ts-ignore */}
                    {user && user.completedCourses.map((course, key) => (
                        <CompletedCourse
                            key={key}
                            title={course.name}
                            date={course.date}
                            id={course.courseId}
                        />
                    ))}
                </div>
            </div>

            { loadingPopup() }

        </main>
    )
}
