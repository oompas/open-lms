import Link from "next/link"

export default function EnrolledCourse({
    title,
    status,
    description,
    time,
    color,
    id
} : {
    title: string,
    status: 2 | 3 | 4 | 5
    description: string,
    time: string,
    color: string,
    id: number
}) {

    const statusValues = {
        2: "To do",
        3: "In progress",
        4: "In progress",
        5: "Completed",
    }

    return (
        <Link 
            className="border-4 w-[32%] m-2 mb-8 p-6 rounded-2xl cursor-pointer hover:opacity-60 duration-100"
            style={{borderColor: color}}
            href={"/course/"+id}
        >
            <div className="text-3xl">{title}</div>
            <div className="text-white w-fit px-3 py-1 rounded-full mt-2" style={{backgroundColor: color}}>{statusValues[status]}</div>
            <div className="mt-4 text-xl">{description}</div>
            <div className="mt-4">{time}</div>
        </Link>
    )
}