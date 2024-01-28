import IDCourse from "./IDCourse";
import Quiz from "./Quiz"

export default function Course({ params }: { params: { id: string } }) {

    const TEMP_ENROLLED_COURSE_DATA = [
        { title: "Dog-Walker Health & Safety Training", status: "Todo", description: "Example course description briefly describing the course contents.", time: "1h 25m", color: "#468DF0", id: 1 },
    ]
    const TEMP_QUIZ_DATA = [
        { title: "Quiz #1", length: "1h", attempts: 3, id: 21},
        { title: "Quiz #2", length: "1h", attempts: 3, id: 22},
        { title: "Quiz #3", length: "2h", attempts: 3, id: 23}
    ]

    return (
        <main className="mt-4 flex flex-col h-fit bg-white w-[100%] p-16 rounded-2xl shadow-custom">
            <div>
                { TEMP_ENROLLED_COURSE_DATA.map((course, key) => (
                    <IDCourse 
                        key={key}
                        title={course.title}
                        status={course.status}
                        description={course.description}
                        time={course.time}
                        color={course.color}
                        id={course.id}
                    />
                ))}
            </div>

            <main className="mt-10 flex justify-left">
            <div className="flex flex-col h-[40vh] bg-white w-[50%] p-10 rounded-2xl shadow-custom">
            <div className="text-2xl mb-4">Available Quizzes:</div>
                <div className="flex flex-row flex-wrap justify-between overflow-y-scroll sm:no-scrollbar">
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
        </main>
    )
}
