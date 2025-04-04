"use client"
import QuizToMark from "@/app/(main)/admin/tools/QuizToMark";
import LearnerInsight from "@/app/(main)/admin/tools/LearnerInsight";
import CourseInsight from "@/app/(main)/admin/tools/CourseInsight";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import TextField from "@/components/TextField";
import { downloadZip } from "client-zip";
import AdminInsight from "@/app/(main)/admin/tools/AdminInsight";
import { callAPI } from "@/helpers/supabase.ts";
import { useAsync } from "react-async-hook";
import { BsDownload } from "react-icons/bs";
import { FiDownload } from "react-icons/fi";
import { IoAdd, IoPersonAdd, IoSearch } from "react-icons/io5";
import { IoMdAdd } from "react-icons/io";
import { MdAdd } from "react-icons/md";

export default function Tools() {

    const router = useRouter();

    const adminInsights = useAsync(() => callAPI('get-admin-insights'));

    enum PopupType {
        InviteLearner,
        DowloadCourseReports,
        DownloadUserReports,
    }

    const [currentPopup, setCurrentPopup] = useState<PopupType | null>(null);
    const [courseSearch, setCourseSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [csvEmails, setCsvEmails] = useState<string[]>([]);

    const getQuizzesToMark = () => {
        if (adminInsights.loading) {
            return <div>Loading...</div>;
        }
        if (!adminInsights.result) {
            return <div>Error loading quizzes to mark</div>;
        }

        const temp_quizzes = [...adminInsights.result.data.quizAttemptsToMark]
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
        return (
            <div className="flex flex-wrap w-full justify-between overflow-y-scroll gap-2 sm:no-scrollbar">
                { /* @ts-ignore */ }
                {temp_quizzes.map((quiz, key) => (
                    <QuizToMark
                        key={key}
                        title={quiz.courseName}
                        date={new Date(quiz.timestamp).toLocaleString()}
                        learner={quiz.userName}
                        id={quiz.id}
                    />
                ))}
                {
                    temp_quizzes.length === 0 &&
                    <div className="flex flex-col w-full justify-center items-center">
                        <div className="text-lg">No quizzes to mark!</div>
                    </div>
                }
            </div>
        );
    }

    const getLearnerInsights = () => {
        if (adminInsights.loading) {
            return <div>Loading...</div>;
        }
        if (!adminInsights.result) {
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
                        { adminInsights.result.data.learners
                            .filter((learner: any) => learner.name.toLowerCase().includes(userSearch.toLowerCase()))
                            .map((learner: any, key: number) => (
                            <LearnerInsight
                                key={key}
                                name={learner.name}
                                email={learner.email}
                                coursesEnrolled={learner.coursesEnrolled}
                                coursesAttempted={learner.coursesAttempted}
                                coursesCompleted={learner.coursesCompleted}
                                id={learner.id}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const getCourseInsights = () => {
        if (adminInsights.loading) {
            return <div>Loading...</div>;
        }
        if (!adminInsights.result) {
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
                        {adminInsights.result.data.courseInsights
                            .filter((course: any) => course.name.toLowerCase().includes(courseSearch.toLowerCase()))
                            .map((course: any, key: number) => <CourseInsight courseData={course} key={key}/>)
                        }
                    </tbody>
                </table>
            </div>
        );
    }

    const getAdminInsights = () => {
        if (adminInsights.loading) {
            return <div>Loading...</div>;
        }
        if (!adminInsights.result) {
            return <div>Error loading admin insights</div>;
        }

        return (
            <div className="flex flex-wrap justify-start overflow-y-scroll sm:no-scrollbar">
                <table className="border-collapse w-full">
                    <thead>
                    <tr className="border-b-2 border-black text-left">
                        <th className="py-1">Name</th>
                        <th className="py-1">Email</th>
                        <th className="py-1">Role</th>
                        <th className="py-1">Courses Created</th>
                        <th className="py-1">Courses Active</th>
                    </tr>
                    </thead>
                    <tbody>
                        {adminInsights.result.data.admins.map((admin: any, key: number) => (
                            <AdminInsight
                                key={key}
                                name={admin.name}
                                email={admin.email}
                                role={admin.role}
                                coursesCreated={admin.coursesCreated}
                                coursesActive={admin.coursesActive}
                                id={admin.id}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const downloadCourseReports = async () => {
        await callAPI('get-course-reports')
            .then(async (response: { data: { courses: string, quizQuestions: string, courseAttempts: string, quizAttempts: string, quizQuestionAttempts: string } }) => {

                // Since there's multiple files, create a zip file
                const currentTime = new Date().toLocaleString().replace(/,/g, '').replace(/ /g, '_');

                const courses = { name: "course_data.csv", lastModified: new Date(), input: response.data.courses };
                const quizQuestions = { name: "quiz_question_data.csv", lastModified: new Date(), input: response.data.quizQuestions };
                const courseAttempts = { name: "course_attempt_data.csv", lastModified: new Date(), input: response.data.courseAttempts };
                const quizAttempts = { name: "quiz_attempt_data.csv", lastModified: new Date(), input: response.data.quizAttempts };
                const quizQuestionAttempts = { name: "quiz_question_attempt_data.csv", lastModified: new Date(), input: response.data.quizQuestionAttempts };

                const blob = await downloadZip([courses, quizQuestions, courseAttempts, quizAttempts, quizQuestionAttempts]).blob();

                // Download the zip file on the user's browser
                const file = document.createElement("a");
                file.href = URL.createObjectURL(blob);
                file.download = `OpenLMS_Course_Reports${currentTime}.zip`;
                document.body.appendChild(file); // Required for this to work in FireFox
                file.click();
                file.remove();

                setCurrentPopup(null);
            })
            .catch((error) => console.log(`Error downloading course reports: ${error}`));
    }

    const downloadUserReports = async () => {
        await callAPI('get-user-reports')
            .then((response: { data: string }) => {

                const currentTime = new Date().toLocaleString().replace(/,/g, '').replace(/ /g, '_');
                const blob = new Blob([response.data], { type: 'text/csv' });

                // Download the file on the user's browser
                const file = document.createElement('a');
                file.href = window.URL.createObjectURL(blob);
                file.download = `OpenLMS_User_Reports_${currentTime}.csv`;
                document.body.appendChild(file); // Required for this to work in FireFox
                file.click();

                setCurrentPopup(null);
            })
            .catch((error) => console.log(`Error downloading course reports: ${error}`));
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
        callAPI('invite-learner', { email: inviteEmail })
            .then(() => {
                alert("User(s) invited!");
                setInviteEmail("");
                setCsvEmails([]);
            })
            .then(() => setCurrentPopup(null))
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
            <div className="flex flex-col bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-2xl mb-4">Invite Learners</div>
                <TextField text={inviteEmail} onChange={setInviteEmail} placeholder="Enter email address" style="w-full mb-2" />
                <div className="text-lg mt-2 mb-6">
                    <label htmlFor="file-input" className="block text-lg cursor-pointer">
                        Or upload a CSV file:
                    </label>
                    <div className="text-sm text-gray-500">CSV should be a single row of consecutive cells populated with valid emails.</div>
                    <input
                        id="file-input"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="mt-4"
                    />
                </div>
                <div className="flex flex-row ml-auto">
                    <Button text="Cancel" onClick={() => setCurrentPopup(null)} style="mr-2"/>
                    <Button text="Invite" onClick={() => handleInvite()} filled/>
                </div>
            </div>
        </div>
    );

    const downloadCourseReportsPopup = (
        <div className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 z-50 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    Downloading course reports will download multiple csv files containing all course and course attempt
                    data (essentially the whole database excluding user data). This make take some time and the files may
                    be large
                </div>
                <div className="flex flex-row mt-4">
                    <Button text="Cancel" onClick={() => setCurrentPopup(null)} style="ml-auto"/>
                    <Button text="Download" onClick={() => downloadCourseReports()} style="ml-4" filled/>
                </div>
            </div>
        </div>
    );

    const downloadUserReportsPopup = (
        <div
            className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 z-50 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    Downloading user reports will download all user-related data, and a summary of their course progress.
                    To see all course progress data in more details, download the course reports instead
                </div>
                <div className="flex flex-row mt-4">
                    <Button text="Cancel" onClick={() => setCurrentPopup(null)} style="ml-auto"/>
                    <Button text="Download" onClick={() => downloadUserReports()} style="ml-4" filled/>
                </div>
            </div>
        </div>
    );

    const renderPopup = () => {
        switch (currentPopup) {
            case PopupType.InviteLearner:
                return invitePopup;
            case PopupType.DowloadCourseReports:
                return downloadCourseReportsPopup;
            case PopupType.DownloadUserReports:
                return downloadUserReportsPopup;
            default:
                return null;
        }
    }

    return (
        <main className="flex-col w-full justify-center items-center">
            {/* Quizzes to mark section */
            adminInsights.result &&
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
            }

            {/* Course insights section */}
            <div className="flex flex-col h-fit max-h-full bg-white p-12 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-row justify-end items-center mb-2 space-x-4">
                    <div className="flex flex-col mr-auto">
                        <div className="text-lg -mb-1">Course Insights</div>
                        <p className="mr-2 text-gray-500">Click on a course to manage course contents.</p>
                    </div>

                    <div className="relative flex items-center max-w-md ml-auto">
                        <IoSearch className="absolute left-3 text-gray-400" size={20}/>
                        <input
                            placeholder="Search..."
                            type={courseSearch}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                            onChange={(e) => setCourseSearch(e.target.value)}
                        />
                    </div>
                    <MdAdd className="ml-5 cursor-pointer" size={25} onClick={() => router.push('/admin/course/new')} filled/>
                    <FiDownload className="ml-5 cursor-pointer" size={25} onClick={() => setCurrentPopup(PopupType.DowloadCourseReports)}/>
                </div>
                {getCourseInsights()}
            </div>

            {/* Learner insights section */}
            <div className="flex flex-col h-fit max-h-full bg-white p-12 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-row justify-end items-center">
                    <div className="flex flex-col mr-auto">
                        <div className="text-lg -mb-1">Learner Insights</div>
                        <p className="mr-2 text-gray-500">Click on a user to view their profile</p>
                    </div>

                    <div className="relative flex items-center max-w-md ml-auto">
                        <IoSearch className="absolute left-3 text-gray-400" size={20}/>
                        <input
                            placeholder="Search..."
                            type={userSearch}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                    </div>
                    <IoPersonAdd className="ml-5 cursor-pointer" size={22} onClick={() => setCurrentPopup(PopupType.InviteLearner)}/>
                    <FiDownload className="ml-5 cursor-pointer" size={25} onClick={() => setCurrentPopup(PopupType.DownloadUserReports)}/>
                </div>
                {getLearnerInsights()}
            </div>

            {/* Admin insights section */}
            <div className="flex flex-col h-fit max-h-full bg-white p-12 rounded-2xl shadow-custom">
                <div className="flex flex-row justify-end items-center">
                    <div className="flex flex-col mr-auto">
                        <div className="text-lg -mb-1">Platform Admins & Developers</div>
                        <p className="mr-2 text-gray-500">Click on a user to view their profile</p>
                    </div>
                </div>
                {getAdminInsights()}
            </div>

            <div className="h-4" />

            {renderPopup()}

        </main>
    )
}
