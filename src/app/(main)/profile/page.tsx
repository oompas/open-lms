"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from "@/components/AuthForm";
import CompletedCourse from "./CompletedCourse";
import Button from "@/components/Button";
import { generateDummyData } from "@/app/(main)/admin/tools/generateData";

export default function Profile() {

    const router = useRouter()

    const [email, setEmail] = useState("")
    const [password, setPass] = useState("")

    const TEMP_COMPLETED_COURSE_DATA = [
        { title: "Completed Course", description: "Completed December 25, 2023", id: 1 },
        { title: "Completed Course", description: "Completed January 5, 2024", id: 2 }
    ];

    const generateData = async () => {
        await generateDummyData()
            .then(() => console.log("Dummy data generated"))
            .catch((error) => console.error("Error generating dummy data: ", error));
    };

    return (
        <main className="flex justify-center w-full h-full pb-[2vh]">
            <div className="flex flex-col h-[80vh] bg-white w-[60%] p-12 rounded-2xl shadow-custom">
                <div className="text-lg mb-4">Account Details</div>
                <div className="flex flex-col space-y-8 w-[30rem]">
                    <AuthForm 
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPass={setPass}
                        showName={false}
                    />
                    <Button text="Delete Account" onClick={() => router.push('/home')}/>
                    <Button text="Add dummy data (WILL CLEAN DATABASE)" onClick={async () => await generateData()}/>
                </div>
            </div>
            <div className="flex flex-col h-[80vh] bg-white w-[38%] ml-[2%] p-12 rounded-2xl shadow-custom">
                <div className="flex flex-row mb-4">
                    <div className="text-lg mr-auto">Completed Courses</div>
                </div>
                <div className="flex flex-col justify-between overflow-y-scroll sm:no-scrollbar">
                    {TEMP_COMPLETED_COURSE_DATA.map((course, key) => (
                        <CompletedCourse
                            key={key}
                            title={course.title}
                            date={course.description}
                            id={course.id}
                        />
                    ))}
                </div>
            </div>
        </main>
    )
}
