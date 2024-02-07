import Link from "next/link";
import IDCourse from "./IDCourse";
import Quiz from "./Quiz"
import Requirement from "./Requirement";
import { MdArrowBack } from "react-icons/md";

export default function Course({ params }: { params: { id: string } }) {

    const TEMP_COURSE = { 
        title: "Dog-Walker Health & Safety Training", 
        status: "Todo", 
        description: "Example course description briefly describing the course contents.", 
        time: "00:16:53", 
        color: "#468DF0", 
        id: 1,
        requirements: [
            { req: "Spend at least 15mins on the course.", done: true },
            { req: "Complete all available quizzes.", done: false }
        ]
    }
    const TEMP_QUIZ_DATA = [
        { title: "Quiz #1", length: "1h", attempts: 3, id: 21},
        { title: "Quiz #2", length: "1h", attempts: 3, id: 22},
        { title: "Quiz #3", length: "2h", attempts: 3, id: 23}
    ]

    return (
        <main className="mt-14 flex flex-col h-fit bg-white w-[100%] p-16 rounded-2xl shadow-custom">

            <Link href="/home" className="flex flex-row space-x-2 items-center mb-6 -mt-8 text-lg hover:opacity-60 duration-150">
                <MdArrowBack size="28" className="text-red-800"/>
                <div>return to my courses</div>
            </Link>

            <IDCourse 
                title={TEMP_COURSE.title}
                status={TEMP_COURSE.status}
                description={TEMP_COURSE.description}
                time={TEMP_COURSE.time}
                id={TEMP_COURSE.id}
            />

            <div className="mt-8 text-2xl">
                <h1 className="mb-4">Required completion verification:</h1>
                { TEMP_COURSE.requirements.map((req, key) => (
                    <Requirement key={key} text={req.req} done={req.done}/>
                ))}
            </div>

            <div className="mt-4">
                <h2 className="text-lg mb-4">Available Quizzes:</h2>
                <div className="flex flex-col w-1/2">
                    { TEMP_QUIZ_DATA.map((quiz, key) => (
                        <Quiz
                            key={key}
                            title={quiz.title}
                            length={quiz.length}
                            attempts={quiz.attempts}
                            id={quiz.id}
                        />
                    ))}
                </div> 
            </div>

        </main>
    )
}
