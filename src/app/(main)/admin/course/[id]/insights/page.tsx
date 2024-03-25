"use client"

import Button from "@/components/Button"
import Link from "next/link";
import { useRouter } from "next/navigation"
import { useState } from "react";
import { LuExternalLink } from "react-icons/lu";


export default function Insights({ params }: { params: { id: string } }) {

    const router = useRouter();

    const TEMP_COURSE_INFO = {
        "courseId": "C0B2T3zhONVZj7ptVMSZ",
        "active": true,
        "name": "Queen's Ergonomics training",
        "description": "Learn how to create a comfortable and efficient work environment",
        "link": "https://www.queensu.ca/risk/safety/general/ergonomics",
        "minTime": null,
        "quiz": {
            "timeLimit": 45,
            "maxAttempts": null,
            "preserveOrder": false,
            "minScore": null
        },
        "quizQuestions": [
            {
                "id": "7CCvrC339QFVbdqNb5ar",
                "type": "sa",
                "question": "why is canda best country in world",
                "marks": 2
            },
            {
                "id": "7H2e8723VsHjgFPrf3ch",
                "type": "tf",
                "question": "The capital of Quebec is Montreal",
                "marks": 2,
                "correctAnswer": 1
            },
            {
                "id": "paq7CGhvzvcaOMhsGKKB",
                "type": "sa",
                "question": "What sets Canada apart from the United states culturally?",
                "marks": 5
            },
            {
                "id": "bxZ0YZpfOeL9hvy8IyJH",
                "type": "mc",
                "question": "What is the smallest province in Canada by area?",
                "marks": 1,
                "answers": [
                    "Ontario",
                    "Quebec",
                    "British Columbia",
                    "Prince Edward Island"
                ],
                "correctAnswer": 3
            },
            {
                "id": "qWczG9jz2fUKFHaB2m6s",
                "type": "mc",
                "question": "What is the capital of Canada?",
                "marks": 1,
                "answers": [
                    "Ottawa",
                    "Toronto",
                    "Montreal",
                    "Vancouver"
                ],
                "correctAnswer": 0
            }
        ],
        "learners": [
            {
                "id": "6Be5XyxekDWILqyWaJmJLJ6aQbH3",
                "name": "Reid Moffat",
                "status": "In Progress",
                "quiz": "idk"
            }
        ]
    }

    const [data, setData] = useState(TEMP_COURSE_INFO);

    const getEnrolledLearners = () => {
        return (
            <div className="flex flex-wrap w-full justify-start overflow-y-scroll sm:no-scrollbar">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-black text-left">
                            <th className="py-1">Name</th>
                            <th className="py-1">Status</th>
                            <th className="py-1">Quiz</th>
                        </tr>
                    </thead>
                    <tbody>
                        { /* @ts-ignore */}
                        { data.learners.map((learner: any, key: number) => (
                            <tr key={key} className="border">
                                <td className="border p-2">
                                    <Link href={"/admin/profile/"+learner.id} className="flex flex-row items-center hover:opacity-60">
                                        {learner.name}
                                        <LuExternalLink className="ml-1" color="rgb(153 27 27)"/>
                                    </Link>
                                </td>
                                <td className="border p-2">
                                    {learner.status}
                                </td>
                                <td className="border p-2">
                                    {learner.quiz}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const getQuizQuestions = () => {
        return (
            <div className="flex flex-wrap w-full justify-start overflow-y-scroll sm:no-scrollbar">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-black text-left">
                            <th className="py-1">Question</th>
                            <th className="py-1">%Correct</th>
                        </tr>
                    </thead>
                    <tbody>
                        { /* @ts-ignore */}
                        { data.quizQuestions.map((question: any, key: number) => (
                            <tr key={key} className="border">
                                <td className="border p-2">
                                    {question.question}
                                </td>
                                <td className="border p-2">
                                    {/* TODO - insert correct % */}
                                    75%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }


    return (
        <main className="w-full h-full pb-4 mb-4">
            <div className="flex flex-row bg-white w-full p-12 rounded-2xl shadow-custom overflow-y-scroll sm:no-scrollbar mb-4">
                <div className="flex flex-col">
                    <div className="text-xl font-bold">{TEMP_COURSE_INFO.name}</div>
                    <div className="text-md mb-4">{TEMP_COURSE_INFO.description}</div>
                    <div className="flex flex-row space-x-6">
                        <div className="flex flex-col items-center">
                            <div>Learners Enrolled</div>
                            <div className="text-3xl font-bold">23</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div>Course Completions</div>
                            <div className="text-3xl font-bold">12</div>
                        </div>
                    </div>
                </div>
                <Button text="Edit Course Contents" onClick={() => router.push("/admin/course/"+params.id)} style="ml-auto" />
            </div>
            <div className="flex flex-row space-x-6">
                <div className="flex flex-col bg-white w-1/2 p-12 rounded-2xl shadow-custom overflow-y-scroll sm:no-scrollbar mb-4">
                    <div className="text-lg mb-2">Enrolled Learners</div>
                    { getEnrolledLearners() }
                </div>
                <div className="flex flex-col bg-white w-1/2 p-12 rounded-2xl shadow-custom overflow-y-scroll sm:no-scrollbar mb-4">
                    <div className="text-lg mb-2">Quiz Questions</div>
                    { getQuizQuestions() }
                </div>
            </div>
        </main>
    )
}