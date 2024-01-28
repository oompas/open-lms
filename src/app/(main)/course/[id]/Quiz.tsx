import Link from "next/link"

export default function Quiz({
    title,
    length,
    attempts,
    id
} : {
    title: string,
    length: string
    attempts: number
    id: number
}) {
    return (
                    <Link className="mt-4 border-4 w-[75vh] mb-8 p-6 rounded-2xl cursor-pointer hover:opacity-60 duration-100" href={"/quiz/"+id}>
                        <div className="text-3xl">{title}</div>
                        <div className="mt-4"> <b>Quiz Length: {length}</b> </div>
                        <div className="mt-2"> <b># of attempts allowed: {attempts}</b> </div>
                        <div className="mt-4 text-2x1"> click to start </div>
                    </Link>
    )
}


