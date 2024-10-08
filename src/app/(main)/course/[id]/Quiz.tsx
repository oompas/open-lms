"use client";

export default function Quiz({
    length,
    numAttempts,
    maxAttempts,
    numQuestions,
    minimumScore,
    totalMarks
} : {
    length: string
    numAttempts: number
    maxAttempts: number
    numQuestions: number
    minimumScore: number
    totalMarks: number
}) {
    return (
        <div className="border-4 p-6 rounded-2xl">
            <div className="flex flex-col items-center">
                <div className="flex flex-row mr-auto text-lg w-full justify-between space-x-4">
                    {length && 
                        <div className="flex flex-col border p-2 rounded-lg items-center justify-center text-center">
                            <div className="w-max text-md">Time Limit</div>
                            <div className="text-3xl">{length}</div>
                            <div className="text-sm">minute{length==="1" ? "" : "s"}</div>
                        </div>
                    }
                    {maxAttempts && 
                        <div className="flex flex-col border p-2 rounded-lg items-center text-center justify-center">
                            <div className="w-max text-md">Attempts</div>
                            <div className="text-3xl">{numAttempts}/{maxAttempts}</div>
                            <div className="text-sm opacity-0">marks</div>
                        </div>
                    }
                    <div className="flex flex-col border p-2 rounded-lg items-center text-center justify-center">
                        <div className="w-max text-md">Questions</div>
                        <div className="text-3xl">{numQuestions}</div>
                        <div className="text-sm opacity-0">marks</div>
                    </div>
                    <div className="flex flex-col border p-2 rounded-lg items-center text-center justify-center">
                        <div className="w-max text-md">Pass Score</div>
                        <div className="text-3xl">{minimumScore}/{totalMarks}</div>
                        <div className="text-sm">marks</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
