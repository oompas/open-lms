import Link from "next/link"

export default function EnrolledCourse({
    title,
    status,
    description,
    time,
    id
} : {
    title: string,
    status: 2 | 3 | 4 | 5
    description: string,
    time: string,
    id: number
}) {

    const statusColors = {
        ENROLLED: "#468DF0",
        IN_PROGRESS: "#EEBD31",
        AWAITING_MARKING: "#0fa9bb",
        FAILED: "#ab0303",
        COMPLETED: "#47AD63",
    }

    return (
        <Link 
            className="border-4 w-[32%] mb-8 p-6 rounded-2xl cursor-pointer hover:opacity-60 duration-100"
            style={{ borderColor: statusColors[status] }}
            href={"/course/"+id}
        >
            <div className="text-3xl">{title}</div>
            <div
                className="text-white w-fit px-3 py-1 rounded-full mt-2"
                style={{ backgroundColor: statusColors[status] }}
            >
                {status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
            </div>
            <div className="mt-4 text-xl">{description}</div>
            <div className="mt-4">{time}</div>
        </Link>
    )
}