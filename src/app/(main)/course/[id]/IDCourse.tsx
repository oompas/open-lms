"use client"

import Button from "@/components/Button"


export default function IDCourse({
    title,
    completed,
    description,
    time,
    link,
    id
} : {
    title: string,
    completed: boolean | null, // null = not started, false = in progress, true = completed
    description: string,
    time: string,
    link: string,
    id: number
}) {

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
                        <Button text="Enroll" onClick={() => alert("enroll")} icon="plus" />
                    </div>
                </div>
                <div className="flex flex-col justify-center items-center ml-auto border-2 rounded-xl px-10 py-4 shadow-lg">
                    <div className="text-sm -mb-1"> elapsed time:</div>
                    <div className="text-3xl">{time}</div>
                    <div className="text-sm mt-2 -mb-1">status:</div>
                    <div className="text-2xl"> {completed === null ? "Todo" : completed ? "Complete" : "In progress"}</div>
                </div>
            </div>
        </main>
    )
}
