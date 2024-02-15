"use client"
import Button from "@/components/Button"
import { getFunctions, httpsCallable } from "firebase/functions";
import { useState } from "react";

export default function IDCourse({
    title,
    courseStatus,
    description,
    minTime,
    startTime,
    link,
    id
} : {
    title: string,
    courseStatus: 1 | 2 | 3 | 4 | 5,
    description: string,
    minTime: number,
    startTime: number,
    link: string,
    id: number
}) {

    const [status, setStatus] = useState(courseStatus);

    const enroll = () => {
        return httpsCallable(getFunctions(), "courseEnroll")({ courseId: id })
            .then((result) => {
                console.log(result);
                setStatus(2);
            })
            .catch((err) => { throw new Error(`Error enrolling in course: ${err}`) });
    };

    const start = () => {
        return httpsCallable(getFunctions(), "startCourse")({ courseId: id })
            .then((result) => {
                console.log(result);
                setStatus(3);
            })
            .catch((err) => { throw new Error(`Error starting course: ${err}`) });
    }

    const renderButton = () => {
        if (status === 1) {
            return <Button text="Enroll" onClick={enroll} icon="plus" />;
        } else if (status === 2) {
            return <Button text="Start course" onClick={start} icon="play" />;
        }
    }

    const statusNames = {
        1: "Not enrolled",
        2: "Enrolled",
        3: "In progress",
        4: "In progress",
        5: "Completed"
    }

    return (
        <main>
            <div className="flex flex-row border-4 rounded-2xl p-8">
                <div className="flex flex-col">
                    <div className="text-2xl font-bold">{title}</div>
                    <div className="mt-2 text-2xl">{description}</div>
                    <div className="flex flex-row space-x-4 mt-4">
                        <a href={link} target={"_blank"}>
                            <Button text="Go to course" onClick={() => {}} filled icon="link" />
                        </a>
                        {renderButton()}
                    </div>
                </div>
                <div className="flex flex-col justify-center items-center ml-auto border-2 rounded-xl px-10 py-4 shadow-lg">
                    <div className="text-sm -mb-1">{courseStatus === 1 ? "Minimum" : "Remaining"} time:</div>
                    <div className="text-3xl">
                        {(Math.floor(minTime / 3600) + "").padStart(2, '0') + ":" + (Math.floor(minTime / 60) % 60 + "").padStart(2, '0') + ":" + (minTime % 60 + "").padStart(2, '0')}
                    </div>
                    <div className="text-sm mt-2 -mb-1">status:</div>
                    <div className="text-2xl">{statusNames[status]}</div>
                </div>
            </div>
        </main>
    )
}
