"use client"
import QuizToMark from "@/app/(main)/admin/tools/QuizToMark";
import LearnerInsight from "@/app/(main)/admin/tools/LearnerInsight";
import CourseInsight from "@/app/(main)/admin/tools/CourseInsight";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiEndpoints, callApi, useAsyncApiCall } from "@/config/firebase";
import TextField from "@/components/TextField";

export default function Tools() {

    const router = useRouter();

    const quizzesToMark = useAsyncApiCall(ApiEndpoints.GetQuizzesToMark, {});
    const courseInsights = useAsyncApiCall(ApiEndpoints.GetCourseInsights, {});
    const learnerInsights = useAsyncApiCall(ApiEndpoints.GetUserInsights, {});

    enum PopupType {
        InviteLearner,
        DowloadCourseReports,
        DownloadUserReports,
    }

    const [currentPopup, setCurrentPopup] = useState<PopupType | null>(null);
    const [courseSearch, setCourseSearch] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");

    const getQuizzesToMark = () => {
        if (quizzesToMark.loading) {
            return <div>Loading...</div>;
        }
        if (quizzesToMark.error) {
            return <div>Error loading quizzes to mark</div>;
        }
        if (quizzesToMark.result) {
            // @ts-ignore
            const temp_quizzes = [...quizzesToMark.result.data]
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
                        {courseInsights.result.data
                            .filter((course: any) => course.name.toLowerCase().includes(courseSearch.toLowerCase()))
                            .map((course: any, key: number) => <CourseInsight courseData={course} key={key}/>)
                        }
                    </tbody>
                </table>
            </div>
        );
    }

    const handleInvite = async () => {
        callApi(ApiEndpoints.InviteLearner, { emails: [inviteEmail]})
            .then(() => alert("user invited!"))
            .then(() => setCurrentPopup(null))
    }

    const invitePopup = (
        <div className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 z-50 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">Enter the user's email address:</div>
                <TextField text={inviteEmail} onChange={setInviteEmail} placeholder="john@email.com" />
                <div className="flex flex-row mt-4">
                    <Button text="Cancel" onClick={() => setCurrentPopup(null)} style="ml-auto" />
                    <Button text="Invite" onClick={() => handleInvite()} style="ml-4" filled />
                </div>
            </div>
        </div>
    )

    const downloadCourseReportsPopup = (
        <div className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 z-50 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    Downloading course reports will download multiple csv files containing all course and course attempt
                    data (essentially the whole database excluding user data). This make take some time and the files may
                    be large
                </div>
                <div className="flex flex-row mt-4">
                    <Button text="Cancel" onClick={() => setCurrentPopup(null)} style="ml-auto" />
                    <Button text="Download" onClick={() => setCurrentPopup(PopupType.DowloadCourseReports)} style="ml-4" filled />
                </div>
            </div>
        </div>
    )

    const downloadUserReportsPopup = (
        <div className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 z-50 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    Downloading user reports will download all user-related data, and a summary of their course progress.
                    To see all course progress data in more details, download the course reports instead
                </div>
                <div className="flex flex-row mt-4">
                    <Button text="Cancel" onClick={() => setCurrentPopup(null)} style="ml-auto" />
                    <Button text="Download" onClick={() => setCurrentPopup(PopupType.DowloadCourseReports)} style="ml-4" filled />
                </div>
            </div>
        </div>
    )

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
                        text={courseSearch}
                        onChange={setCourseSearch}
                    />
                    <Button text="Create a Course" onClick={() => router.push('/admin/course/new')} filled />
                    <Button text="Download Course Reports" onClick={() => setCurrentPopup(PopupType.DowloadCourseReports)}/>
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
                    <Button text="Invite New Learners" onClick={() => setCurrentPopup(PopupType.InviteLearner)}/>
                    <Button text="Download User Reports" onClick={() => setCurrentPopup(PopupType.DownloadUserReports)} style="ml-4"/>
                </div>
                {getLearnerInsights()}
            </div>

            <div className="h-4" />

            {renderPopup()}

        </main>
    )
}
