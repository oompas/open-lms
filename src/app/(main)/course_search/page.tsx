"use client";
import { useAsync } from 'react-async-hook';
import AvailableCourse from "./AvailableCourse";
import { getFunctions, httpsCallable } from "firebase/functions";
import "../../../config/firebase";
import { useState } from "react";
import TextField from '@/components/TextField';
import Link from 'next/link';
import { MdArrowBack } from 'react-icons/md';

export default function Home() {

    const courses = useAsync(httpsCallable(getFunctions(), 'getAvailableCourses'), []);
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
                    <div>return to my courses</div>
                </Link>
                <div className="flex flex-row items-center">
                    <div className="text-lg mb-4">Available Courses</div> 
                    <TextField text={search} onChange={setSearch} placeholder='search for a course title...' style="mb-4 ml-auto w-1/3"/>
                </div>
                <div className="flex flex-col gap-4 justify-between overflow-y-scroll sm:no-scrollbar">
                    {availableCourses()}
                </div>
            </div>
        </main>
    )
}