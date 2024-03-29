"use client"
import QuizToMark from "@/app/(main)/admin/tools/QuizToMark";
import LearnerInsight from "@/app/(main)/admin/tools/LearnerInsight";
import CourseInsight from "@/app/(main)/admin/tools/CourseInsight";
import Button from "@/components/Button";
import {useRouter} from "next/navigation";
import { useState } from "react";
import { useAsync } from "react-async-hook";
import { callApi } from "@/config/firebase";
import TextField from "@/components/TextField";

export default function Tools() {

    const quizzesToMark = useAsync(() => callApi('getQuizzesToMark', {}), []);
    const learnerInsights = useAsync(() => callApi('getUserReports', {}), []);
    const courseInsights = useAsync(() => callApi('getCourseReports', {}), []);

    const router = useRouter();
    const [search, setSearch] = useState("");
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [csvEmails, setCsvEmails] = useState<string[]>([]);

    const getQuizzesToMark = () => {
        if (quizzesToMark.loading) {
            return <div>Loading...</div>;
        }
        if (quizzesToMark.error) {
            return <div>Error loading quizzes to mark</div>;
        }
        if (quizzesToMark.result) {
            // @ts-ignore
            var temp_quizzes = [...quizzesToMark.result.data]
            if (temp_quizzes.length % 4 === 1) {
                temp_quizzes.push({courseName: "_placeholder", timestamp: 0, userName: "", quizAttemptId: 0})
                temp_quizzes.push({courseName: "_placeholder", timestamp: 0, userName: "", quizAttemptId: 0})
                temp_quizzes.push({courseName: "_placeholder", timestamp: 0, userName: "", quizAttemptId: 0})
            } else if (temp_quizzes.length % 4 === 2) {
                temp_quizzes.push({courseName: "_placeholder", timestamp: 0, userName: "", quizAttemptId: 0})
                temp_quizzes.push({courseName: "_placeholder", timestamp: 0, userName: "", quizAttemptId: 0})
            } else if (temp_quizzes.length % 4 === 3) {
                temp_quizzes.push({courseName: "_placeholder", timestamp: 0, userName: "", quizAttemptId: 0})
            }
            //console.log(temp_quizzes)
            return (
                <div className="flex flex-wrap w-full justify-between overflow-y-scroll gap-2 sm:no-scrollbar">
                    { /* @ts-ignore */ }
                    {temp_quizzes.map((quiz, key) => (
                        <QuizToMark
                            key={key}
                            title={quiz.courseName}
                            date={new Date(quiz.timestamp*1000).toLocaleString()}
                            learner={quiz.userName}
                            id={quiz.quizAttemptId}
                        />
                    ))}
                </div>
            );
        }
    }

    const getLearnerInsights = () => {
        if (learnerInsights.loading) {
            return <div>Loading...</div>;
        }
        if (!learnerInsights.result) {
            return <div>Error loading learner insights</div>;
        }

        return (
            <div className="flex flex-wrap justify-start overflow-y-scroll sm:no-scrollbar">
                <table className="border-collapse w-full mt-2">
                    <thead>
                        <tr className="border-b-2 border-black text-left">
                            <th rowSpan={2} colSpan={1}>
                                Name
                            </th>
                            <th rowSpan={2} colSpan={1}>
                                Email
                            </th>
                            <th className="py-1">Enrolled</th>
                            <th className="py-1">In Progress</th>
                            <th className="py-1">Completed</th>
                        </tr>
                    </thead>
                    <tbody>
                        { /* @ts-ignore */}
                        { learnerInsights.result.data.map((learner: any, key: number) => (
                            <LearnerInsight
                                key={key}
                                name={learner.name}
                                email={learner.email}
                                coursesEnrolled={learner.coursesEnrolled}
                                coursesAttempted={learner.coursesAttempted}
                                coursesCompleted={learner.coursesComplete}
                                id={learner.uid}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const getCourseInsights = () => {
        if (courseInsights.loading) {
            return <div>Loading...</div>;
        }
        if (!courseInsights.result) {
            return <div>Error loading course insights</div>;
        }

        return (
            <div className="flex flex-wrap justify-start overflow-y-scroll sm:no-scrollbar">
                <table className="border-collapse w-full">
                    <thead>
                        <tr className="border-b-2 border-black text-left">
                            <th className="py-1">Course Name</th>
                            <th className="py-1">Learners Completed</th>
                            <th className="py-1">Average Completion Time</th>
                            <th className="py-1">Average Quiz Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        { /* @ts-ignore */}
                        { courseInsights.result.data
                        .filter((course: any) => course.name.toLowerCase().includes(search.toLowerCase()))
                        .map((course: any, key: number) => (
                            <CourseInsight courseData={course}/>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const handleInvite = async () => {
        let emailsToInvite: string[] = [];
        if (csvEmails.length > 0) {
            emailsToInvite = [...csvEmails];
        }
        if (inviteEmail.trim() !== "") {
            const emailRegex = /^\w+[-.\w%]*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
            if (emailRegex.test(inviteEmail.trim())) {
                emailsToInvite.push(inviteEmail.trim());
            }
        }
        if (emailsToInvite.length === 0) {
            alert("Please enter a valid email address or upload a valid CSV file. CSV should be a single row of consecutive cells populated with valid emails.");
            return;
        }
        callApi("inviteLearner", { emails: emailsToInvite })
            .then(() => {
                alert("User(s) invited!");
                setInviteEmail("");
                setCsvEmails([]);
            })
            .then(() => setShowInvite(false))
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target) {
                    const contents = event.target.result as string;
                    const emails = parseCSV(contents);
                    setCsvEmails(emails);
                }
            };
            reader.onerror = (event) => {
                console.error("Error reading file:", event.target?.error);
            };
            reader.readAsText(file);
        }
    };

    const parseCSV = (contents: string) => {
        const regex = /^\s*\w+[-.\w%]*@\w+([-.]\w+)*\.\w+([-.]\w+)*(?:\s*,\s*\w+[-.\w%]*@\w+([-.]\w+)*\.\w+([-.]\w+)*)*\s*$/;
        const matches = contents.match(regex);
        if (matches) {
            return matches[0].split(',').map((email) => email.trim());
        } else {
            return [];
        }
    };

    const invitePopup = (
        <div className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 z-50 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-2xl mb-4">Invite Learners</div>
                <div className="mb-2">
                    <TextField text={inviteEmail} onChange={setInviteEmail} placeholder="Enter email address"/>
                </div>
                <div className="text-lg mb-4">
                    <label htmlFor="file-input" className="block mb-2 cursor-pointer">
                        Or upload a CSV file:
                    </label>
                    <input
                        id="file-input"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="mb-2"
                    />
                </div>
                <div className="flex flex-row">
                    <Button text="Cancel" onClick={() => setShowInvite(false)} style="mr-2"/>
                    <Button text="Invite" onClick={() => handleInvite()} filled/>
                </div>
            </div>
        </div>
    );

    return (
        <main className="flex-col w-full justify-center items-center">
            {/* Quizzes to mark section */}
            <div className="flex flex-col h-fit max-h-full bg-white p-12 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-row justify-between items-center mb-2">
                    <div className="flex flex-col">
                        <div className="text-lg mb-2">Quizzes To Mark</div>
                    </div>
                </div>
                <div className="flex flex-wrap justify-between overflow-y-scroll gap-2 sm:no-scrollbar">
                    {getQuizzesToMark()}
                </div>
            </div>

            {/* Course insights section */}
            <div className="flex flex-col h-fit max-h-full bg-white p-12 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-row justify-end items-center mb-2 space-x-4">
                    <div className="flex flex-col mr-auto">
                        <div className="text-lg -mb-1">Course Insights</div>
                        <p className="mr-2 text-gray-500">Click on a course to manage course contents.</p>
                    </div>
                    <TextField 
                        placeholder="Search for a course..."
                        text={search}
                        onChange={setSearch}
                    />
                    <Button text="Create a Course" onClick={() => router.push('/admin/course/new')} filled />
                    <Button text="Download Course Reports" onClick={() => alert("TODO: download course reports")}/>
                </div>
                {getCourseInsights()}
            </div>

            {/* Learner insights section */}
            <div className="flex flex-col h-fit max-h-full bg-white p-12 rounded-2xl shadow-custom">
                <div className="flex flex-row justify-end items-center">
                    <div className="flex flex-col mr-auto">
                        <div className="text-lg -mb-1">Learner Insights</div>
                        <p className="mr-2 text-gray-500">Click on a user to view individual data.</p>
                    </div>
                    <Button text="Invite New Learners" onClick={() => setShowInvite(true)}/>
                    <Button text="Download User Reports" onClick={() => alert("TODO: download user reports")} style="ml-4"/>
                </div>
                {getLearnerInsights()}
            </div>

            <div className="h-4" />

            { showInvite && invitePopup }

        </main>
    )
}
