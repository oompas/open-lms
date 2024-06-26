"use client";
import AvailableCourse from "./AvailableCourse";
import "../../../config/firebase";
import { useState } from "react";
import TextField from '@/components/TextField';
import Link from 'next/link';
import { MdArrowBack } from 'react-icons/md';
import { useRouter } from "next/navigation";
import { auth } from '@/config/firebase';
import { ApiEndpoints, useAsyncApiCall } from "@/config/firebase";

export default function Home() {

    const router = useRouter();

    // if user is Admin - go to admin tools
    auth.onAuthStateChanged((user) => {
        if (user) {
            auth.currentUser?.getIdTokenResult()
                .then((idTokenResult) => !!idTokenResult.claims.admin ? router.replace('/admin/tools') : null)
                .catch((error) => console.log(`Error fetching user ID token: ${error}`));
        }
    });

    const courses = useAsyncApiCall(ApiEndpoints.GetAvailableCourses, {});

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
        <main className="flex w-full mb-4 justify-center">
            <div className="flex flex-col w-full h-full bg-white p-12 rounded-2xl shadow-custom">
                <Link href="/home"
                    className="flex flex-row space-x-2 items-center mb-2 -mt-4 text-lg hover:opacity-60 duration-150">
                    <MdArrowBack size="28" className="text-red-800"/>
                    <div>Return To My Courses</div>
                </Link>
                <div className="flex flex-row items-center">
                    <div className="text-lg mb-4">Available Courses</div> 
                    <TextField text={search} onChange={setSearch} placeholder='Search for a course title...' style="mb-4 ml-auto w-1/3"/>
                </div>
                <div className="flex flex-col gap-4 justify-between overflow-y-scroll sm:no-scrollbar">
                    {availableCourses()}
                </div>
            </div>
        </main>
    )
}