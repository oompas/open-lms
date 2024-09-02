"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CompletedCourse from "./CompletedCourse";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import { generateDummyData } from "@/app/(main)/admin/tools/generateData";
import { ApiEndpoints, auth, useAsyncApiCall } from '@/config/firebase';
import { callAPI, signOut } from "@/config/supabase.ts";
import { useAsync } from "react-async-hook";

export default function Profile() {

    const router = useRouter();

    const getUserData = useAsync(() => callAPI('get-profile').then(r => setUser(r.data)), {});

    const [user, setUser] = useState(undefined);

    // const unixToString = (unix: number) => {
    //     if (unix === -1) {
    //         return "Never";
    //     }
    //
    //     return new Date(unix).toDateString() + ", " + new Date(unix).toLocaleTimeString();
    // }

    // useEffect(() => {
    //     let unsubscribe: () => void;
    //     unsubscribe = auth.onAuthStateChanged(async (user) => {
    //         if (user) {
    //             try {
    //                 const idTokenResult = await user.getIdTokenResult();
    //                 if (idTokenResult.claims.admin && idTokenResult.claims.developer) {
    //                     setStatus("DEVELOPER");
    //                 } else if (idTokenResult.claims.admin && !idTokenResult.claims.developer) {
    //                     setStatus("ADMINISTRATOR");
    //                 } else {
    //                     setStatus("LEARNER");
    //                 }
    //             } catch (error) {
    //                 console.error("Error getting custom claims: ", error);
    //             }
    //         }
    //     });
    //     return unsubscribe;
    // }, []);

    const generateData = async () => {
        await generateDummyData()
            .then(() => console.log("Dummy data generated"))
            .catch((error) => console.error("Error generating dummy data: ", error));
    };

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
            <div className={`flex flex-col h-[80vh] bg-white ${user?.role === "Learner" ? 'w-[60%]' : 'w-full'} p-12 rounded-2xl shadow-custom`}>
                <div className="text-lg mb-4">Your Account Details</div>
                <div className="flex flex-col h-full">
                    {user?.role && <StatusBadge status={user?.role} style="mb-2"/>}
                    {/* @ts-ignore */}
                    <div className="text-2xl font-bold mt-2">{user && user.name}</div>
                    <div className="flex flex-col h-full items-end mb-auto">
                        {/* @ts-ignore */}
                        <div className="mr-auto text-lg mb-4">{user && user.email}</div>
                        {/* @ts-ignore */}
                        <div className="mr-auto text-lg">Joined: <i>{user && user.signUpDate}</i></div>
                    </div>
                    <Button text="Log Out" onClick={async () => await logout()}/>
                    {/* <Button text="Add dummy data (WILL CLEAN DATABASE)" onClick={async () => await generateData()}/> */}
                </div>
            </div>
            {user?.role === "Learner" && (
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
            )}
            { loadingPopup() }

        </main>
    )
}
