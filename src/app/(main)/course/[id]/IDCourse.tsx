"use client"
import Button from "@/components/Button"
import { getFunctions, httpsCallable } from "firebase/functions";
import { useEffect, useState } from "react";

export default function IDCourse({
    title,
    courseStatus,
    description,
    startTime,
    minTime,
    link,
    id
} : {
    title: string,
    courseStatus: 1 | 2 | 3 | 4 | 5,
    description: string,
    startTime: number,
    minTime: number,
    link: string,
    id: number
}) {

    const [status, setStatus] = useState(courseStatus);

    const [countdown, setCountDown] = useState(60 * minTime - Math.floor(new Date().getTime() / 1000 - startTime));

    useEffect(() => {
        if (countdown <= 0) return;

        const interval = setInterval(() => setCountDown(countdown - 1), 1000);
        return () => clearInterval(interval);
    }, [countdown]);

    const enroll = () => {
        return httpsCallable(getFunctions(), "courseEnroll")({ courseId: id })
            .then(() => setStatus(2))
            .catch((err) => { throw new Error(`Error enrolling in course: ${err}`) });
    };

    const unEnroll = () => {
        return httpsCallable(getFunctions(), "courseUnenroll")({ courseId: id })
            .then(() => setStatus(1))
            .catch((err) => { throw new Error(`Error unenrolling in course: ${err}`) });
    };

    const start = () => {
        return httpsCallable(getFunctions(), "startCourse")({ courseId: id })
            .then(() => {
                setCountDown(60 * minTime);
                setStatus(3);
            })
            .catch((err) => { throw new Error(`Error starting course: ${err}`) });
    }

    const renderButton = () => {
        if (status === 1) {
            return <Button text="Enroll" onClick={enroll} icon="plus" />;
        } else if (status === 2) {
            return (
                <>
                    <a href={link} target={"_blank"}>
                        <Button text="Start course" onClick={async () => await start()} filled icon="link"/>
                    </a>
                    <Button text="Unenroll" onClick={unEnroll} icon="minus"/>
                </>
            );
        }
        return (
            <a href={link} target={"_blank"}>
                <Button text="Go to course" onClick={() => {}} filled icon="link"/>
            </a>
        );
    }

    const statusNames = {
        1: "Not enrolled",
        2: "Enrolled",
        3: "In progress",
        4: "In progress",
        5: "Completed"
    }

    const getTime = () => {
        const format = (time: number) => (Math.floor(time / 3600) + "").padStart(2, '0') + ":"
            + (Math.floor(time / 60) % 60 + "").padStart(2, '0') + ":" + (time % 60 + "").padStart(2, '0');

        if (status === 1 || status === 2) {
            return format(60 * minTime);
        }
        return format(countdown);
    }

    return (
        <main>
            <div className="flex flex-row border-4 rounded-2xl p-8">
                <div className="flex flex-col">
                    <div className="text-2xl font-bold">{title}</div>
                    <div className="mt-2 text-2xl">{description}</div>
                    <div className="flex flex-row space-x-4 mt-4">
                        {renderButton()}
                    </div>
                </div>
                <div
                    className="flex flex-col justify-center items-center ml-auto border-2 rounded-xl px-10 py-4 shadow-lg">
                    <div className="text-sm -mb-1">status:</div>
                    <div className="text-2xl">{statusNames[status]}</div>
                    <div className="text-sm mt-2">{status === 1 ? "Minimum" : "Required"} time:</div>
                    <div className="text-3xl">
                        {countdown > 0 || status < 3 ? getTime() : "Completed"}
                    </div>
                </div>
            </div>
        </main>
    )
}
