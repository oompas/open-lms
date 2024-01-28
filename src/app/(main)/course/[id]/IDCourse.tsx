export default function IDCourse({
    title,
    status,
    description,
    time,
    color,
    id
} : {
    title: string,
    status: string,
    description: string,
    time: string,
    color: string,
    id: number
}) {
    return (
        <main>
            <main className="border-4 w-[100%] mb-8 p-10 rounded-2xl"             style={{borderColor: color}}>
                <div className="text-6xl">{title}
                    <div className="mt-4 text-xl text-white w-fit px-3 py-1 rounded-full mt-2" style={{backgroundColor: color}}>{status} </div>
                    <div className="mt-4 text-xl">{description}</div>

                </div>
            </main>
            <div className="mt-5 text-xl">
                <b>Required completion verification:</b>
                <div className="mt-2"> Spend at Least 15 mins on the course.</div>
                <div className="mt-2"> Complete available Quizzes.</div>
            </div>
        </main>
    )
}


