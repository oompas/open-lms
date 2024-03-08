export default function QuizQuestion({
    question,
    options,
    id
} : {
    question: string,
    options: string[],
    id: number
}) {
    return (
        <div className="flex mt-4">
            <div className="bg-white w-full p-16 rounded-2xl shadow-custom">
                <div className="text-2xl mb-8">Q{id}: {question}</div>
                <div className="flex flex-col space-y-4">
                    {options.map((option, index) => (
                        // Button selection should eventually set completed to true
                        <div key={index} className="flex items-center">
                            <input type="radio" id={`option${index}`} name={`question${id}`} value={option}/>
                            <label htmlFor={`option${index}`} className="ml-2">{option}</label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}