"use client"
import Button from "@/components/Button"
import { useEffect, useState } from "react";
import { ApiEndpoints, callApi } from "@/config/firebase";
import TextField from "@/components/TextField";

export default function IDCourse({
    course,
    timeDone,
    setTimeDone,
    status,
    setStatus,
    setCourseAttemptId
} : {
    course: {
        name: string,
        status: 1 | 2 | 3 | 4 | 5,
        description: string,
        startTime: number,
        minTime: number,
        link: string,
        courseId: number
    },
    timeDone: boolean,
    setTimeDone: any,
    status: number,
    setStatus: any,
    setCourseAttemptId: any
}) {

    const startingCountdown = () => {
        const currentSeconds = new Date().getTime() / 1000;
        const timeSinceStart = Math.floor(currentSeconds - course.startTime);
        const minimumSeconds = 60 * course.minTime;

        return minimumSeconds - timeSinceStart;
    }

    const [countdown, setCountDown] = useState(startingCountdown());

    useEffect(() => {
        if (countdown <= 0) {
            if (status > 2 && !timeDone) {
                setTimeDone(true);
            }
            return;
        }

        const interval = setInterval(() =>
            setCountDown(Math.round(course.startTime + (60 * course.minTime) - (new Date().getTime() / 1000))),
            1000);
        return () => clearInterval(interval);
    }, [countdown]);

    const enrollment = () => {
        return callApi(ApiEndpoints.CourseEnrollment, { courseId: course.courseId })
            .then(() => setStatus(status === 1 ? 2 : 1))
            .catch((err) => { throw new Error(`Error enrolling in course: ${err}`) });
    };

    const start = () => {
        return callApi(ApiEndpoints.StartCourse, { courseId: course.courseId })
            .then((result) => {
                setCourseAttemptId(result.data);
                setCountDown(60 * course.minTime);
                course.startTime = new Date().getTime() / 1000;
                setStatus(3);
            })
            .catch((err) => { throw new Error(`Error starting course: ${err}`) });
    }


    const renderButton = () => {
        if (status === 1) {
            return <Button text="Enroll" onClick={enrollment} icon="plus" />;
        } else if (status === 2) {
            return (
                <>
                    <a href={course.link} target={"_blank"}>
                        <Button text="Start course" onClick={async () => await start()} filled icon="link"/>
                    </a>
                    <Button text="Unenroll" onClick={enrollment} icon="minus"/>
                    <Button text="Request help" onClick={handleSupportRequest} icon="report"/>
                </>
            );
        }
        return (
            <>
                <a href={course.link} target={"_blank"}>
                    <Button text="Go to course" onClick={() => {}} filled icon="link"/>
                </a>
            </>
        );
    }

    const statusNames = {
        1: "Not enrolled",
        2: "To do",
        3: "In progress",
        4: "Awaiting marking",
        5: "Failed",
        6: "Completed",
    }
    const statusColors = {
        2: "#468DF0",
        3: "#EEBD31",
        4: "#0fa9bb",
        5: "#ab0303",
        6: "#47AD63",
    }

    const getTime = () => {
        const format = (time: number) => (Math.floor(time / 3600) + "").padStart(2, '0') + ":"
            + (Math.floor(time / 60) % 60 + "").padStart(2, '0') + ":" + (time % 60 + "").padStart(2, '0');

        if (status === 1 || status === 2) {
            return format(60 * course.minTime);
        }
        return format(countdown);
    }

    const [showSupportForm, setShowSupportForm] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [feedbackSent, setFeedbackSent] = useState(false);

    const handleSubmitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const courseId = course.courseId;
        try {
            await callApi(ApiEndpoints.SendCourseFeedback, { courseId, feedback });
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
                    <div className="fixed flex justify-center items-center w-full h-full top-0 left-0 z-50 bg-white bg-opacity-50">
                        <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                            <div className="text-lg mb-2">Request course support or report issue.</div>
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
                {/* @ts-ignore */}
                <div className="flex flex-col justify-center items-center ml-auto border-4 rounded-xl px-10 py-4 shadow-lg" style={{borderColor: statusColors[status]}}>
                    <div className="text-sm -mb-1">status:</div>
                    { /* @ts-ignore */ }
                    <div className="text-2xl text-center">{statusNames[status]}</div>
                    {course.minTime && (
                        <>
                            <div className="text-sm mt-2">{status === 1 ? "Minimum" : "Required"} time:</div>
                            <div className="text-3xl">
                                {countdown > 0 || status < 3 ? getTime() : "Completed"}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}
