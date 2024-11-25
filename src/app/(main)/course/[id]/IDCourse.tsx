"use client"
import Button from "@/components/Button"
import { useEffect, useState } from "react";
import TextField from "@/components/TextField";
import { callAPI } from "@/helpers/supabase.ts";
import { useRouter } from "next/navigation";

export default function IDCourse({
    course,
    timeDone,
    setTimeDone,
    status,
    setStatus,
    setCourseAttemptId,
    quizStarted,
    courseAttemptId,
    quizAttemptId,
    courseId
} : {
    course: {
        name: string,
        status: string,
        description: string,
        minTime: number,
        link: string,
        courseAttempt: {
            numAttempts: number,
            currentStartTime: string,
            currentQuizAttemptId: number
        } | null
    },
    timeDone: boolean,
    setTimeDone: any,
    status: number,
    setStatus: any,
    setCourseAttemptId: any,
    quizStarted: any,
    courseAttemptId: number,
    quizAttemptId: string,
    courseId: number
}) {

    const router = useRouter();

    const startingCountdown = () => {
        const currentMillis = new Date().getTime();
        const timeSinceStart = Math.floor(currentMillis - (course.courseAttempt ? new Date(course.courseAttempt.currentStartTime).getTime() : 0));
        const minimumMillis = 60 * 1000 * course.minTime;

        return minimumMillis - timeSinceStart;
    }

    const [countdown, setCountDown] = useState(startingCountdown());

    useEffect(() => {
        if (countdown <= 0) {
            if (status === "IN_PROGRESS" && !timeDone) {
                setTimeDone(true);
                location.reload();
            }
            return;
        }

        const interval = setInterval(() =>
            setCountDown(Math.round((course.courseAttempt ? new Date(course.courseAttempt.currentStartTime).getTime() : 0) + (60 * 1000 * course.minTime) - new Date().getTime())),
            200);
        return () => clearInterval(interval);
    }, [countdown]);

    const enrollment = () => {
        return callAPI('course-enrollment', { courseId: course.id })
            .then(() => setStatus(status === "ENROLLED" ? "NOT_ENROLLED" : "ENROLLED"))
            .catch((err) => { throw new Error(`Error getting course data: ${err}`) });
    };

    const start = () => {
        return callAPI('start-course', { courseId: course.id })
            .then((result) => {
                setCourseAttemptId(result.data);
                setCountDown(60 * course.minTime);
                if (!course.courseAttempt) {
                    course.courseAttempt = {};
                }
                course.courseAttempt.currentStartTime = new Date().getTime();
                setStatus("IN_PROGRESS");
            })
            .catch((err) => { throw new Error(`Error starting course: ${err}`) });
    }

    const goToQuiz = async () => {
        if (quizStarted) {
            router.push(`/quiz/${courseId}-${quizAttemptId}`);
        } else {
            await callAPI('start-quiz', { courseId: courseId, courseAttemptId: courseAttemptId })
                .then((result) => router.push(`/quiz/${courseId}-${result.data}`))
                .catch((e) => console.log(`Error starting quiz: ${e}`));
        }
    }

    const renderButton = () => {
        if (status === "NOT_ENROLLED") {
            return <Button text="Enroll" onClick={enrollment} icon="plus" />;
        } else if (status === "ENROLLED") {
            return (
                <>
                    <a href={course.link} target={"_blank"}>
                        <Button text="Start Course" onClick={async () => await start()} filled icon="link"/>
                    </a>
                    <Button text="Unenroll" onClick={enrollment} icon="minus"/>
                    <Button text="Request Help" onClick={handleSupportRequest} icon="report"/>
                </>
            );
        }
        return (
            <>
                {quizStarted !== null && status !== "COMPLETED" &&
                    <Button
                        text={quizStarted ? "Continue quiz" : "Start quiz"}
                        onClick={async () => await goToQuiz()}
                        style=""
                        icon="link"
                        filled
                    />
                }
                <a href={course.link} target={"_blank"}>
                    <Button text="Go to Course" filled={quizStarted === null && (status !== "ENROLLED" || status !== "COMPLETED")} icon="link"/>
                </a>
                <Button text="Request Help" onClick={handleSupportRequest} icon="report"/>
            </>
        );
    }

    const statusColors = {
        "ENROLLED": "#468DF0",
        "IN_PROGRESS": "#EEBD31",
        "AWAITING_MARKING": "#0fa9bb",
        "FAILED": "#ab0303",
        "COMPLETED": "#47AD63",
    }

    const getTime = () => {
        const format = (time: number) => {
            const hours = (Math.floor(time / 3600) + "").padStart(2, '0');
            const minutes = (Math.floor(time / 60) % 60 + "").padStart(2, '0');
            const seconds = (Math.floor(time % 60) + "").padStart(2, '0');

            return `${hours}:${minutes}:${seconds}`;
        }

        if (status === "NOT_ENROLLED" || status === "ENROLLED") {
            return format(60 * course.minTime);
        }
        return format(countdown / 1000);
    }

    const [showSupportForm, setShowSupportForm] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [feedbackSent, setFeedbackSent] = useState(false);

    const handleSubmitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await callAPI('send-course-help', { courseId, feedback });
            setFeedback('');
            setFeedbackSent(true);
        } catch (error) {
            console.error('Error sending feedback:', error);
        }
    };

    const handleSupportRequest = () => {
        setShowSupportForm(true);
    };

    return (
        <main>
            <div className="flex flex-row border rounded-2xl p-8">
                <div className="flex flex-col">
                    <div className="text-2xl font-bold">{course.name}</div>
                    <div className="mt-2 text-2xl">{course.description}</div>
                    <div className="flex flex-row space-x-4 mt-4 mb-4">
                        {renderButton()}
                    </div>
                </div>
                { showSupportForm && (
                    <div
                        className="fixed flex justify-center items-center w-full h-full top-0 left-0 z-50 bg-white bg-opacity-50"
                    >
                        <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                            <div className="text-lg font-bold mb-2">Request support or report issue for <i>'{course.name}'</i></div>
                            <div className="mb-2"><i>If you have an issue with the platform, click 'Request Technical Support' on the bottom pop-up</i></div>
                            <TextField text={feedback} onChange={setFeedback} area placeholder="Type your message here..." />
                            <form onSubmit={handleSubmitFeedback} className="flex flex-col justify-left">
                                <div className="flex flex-row ml-auto mt-4">
                                    <Button text="Cancel" onClick={() => {
                                        setShowSupportForm(false);
                                        setFeedbackSent(false);
                                    }} style="mr-4" />
                                    <Button text="Submit" onClick={handleSubmitFeedback} filled/>
                                </div>
                                { feedbackSent && <p className="text-green-700 mt-4">Request sent successfully - course admins will be in touch once your message is received!</p> }
                            </form>
                        </div>
                    </div>
                )}
                <div className="flex flex-col justify-center items-center ml-auto border-4 rounded-xl px-10 py-4 shadow-lg" style={{borderColor: statusColors[status]}}>
                    <div className="text-sm -mb-1">Status:</div>
                    <div className="text-2xl text-center">{status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</div>
                    {course.minTime && (
                        <>
                            <div className="text-sm mt-2">{status === "NOT_ENROLLED" ? "Minimum" : "Required"} Time:</div>
                            <div className="text-3xl">
                                {countdown > 0 || status === "NOT_ENROLLED" || status === "ENROLLED" ? getTime() : "Completed"}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}
