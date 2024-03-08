"use client"
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import TextField from "@/components/TextField";
import { useEffect, useState } from "react";
import { MdAdd } from "react-icons/md";
import QuizQuestion from "./QuizQuestion";
import CreateQuestion from "./CreateQuestion";
import { callApi } from "@/config/firebase";

export default function AdminCourse({ params }: { params: { id: string } }) { 

    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [link, setLink] = useState("");

    const [useMinCourseTime, setUseMinCourseTime] = useState(true);
    const [minCourseTime, setMinCourseTime] = useState(1);

    const [useQuiz, setUseQuiz] = useState(true)
    const [quizNum, setQuizNum] = useState(1);
    const [quizMinScore, setQuizMinScore] = useState(0);
    const [quizAttempts, setQuizAttempts] = useState(1);
    const [useQuizMaxTime, setUseQuizMaxTime] = useState(true);
    const [quizMaxTime, setQuizMaxTime] = useState(1);

    const [showCreateQuestion, setShowCreateQuestion] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
    const [editQuestion, setEditQuesiton] = useState(-1);

    const handleAddQuestion = ( num: number, data: any ) => {
        // called by "save question" in create question modal
        const temp = [...quizQuestions];
        if (num != -1)
            temp[num] = data;
        else
            temp.push(data);

        setQuizQuestions(temp);
        setEditQuesiton(-1);
        setShowCreateQuestion(false);
    }

    const handleEditQuestion = (num: number) => {
        setEditQuesiton(num-1)
    }

    const handleDeleteQuestion = (num: number) => {
        // TODO - question delete confirmation
        const temp = [...quizQuestions];
        temp.splice(num-1, 1);
        setQuizQuestions(temp);
    }

    useEffect(() => {
        if (editQuestion != -1)
            setShowCreateQuestion(true)
    }, [editQuestion])

    const publishCourse = async () => {

        const courseData = {
            name: title,
            description: desc,
            link: link,
            minTime: Number(minCourseTime),
            active: true,
        }

        const courseId = await callApi("addCourse")(courseData).then((result) => result.data);

        const quizData = {
            courseId: courseId,
            metaData: {
                minScore: Number(quizMinScore),
                maxAttempts: Number(quizAttempts),
                timeLimit: Number(quizMaxTime),
            },
            questions: quizQuestions.map((q) => ({ correctAnswer: 1, ...q })),
        }

        await callApi("addQuiz")(quizData);
    }

    return (
        <main className="flex flex-row justify-center pt-14">
            
            {/* this covers the existing nav buttons in the topbar */}
            <div className="absolute flex flex-row items-center space-x-4 bg-white top-0 right-24 h-32 px-12 text-2xl rounded-b-3xl">
                <Button text="Save Changes" onClick={() => alert("save")} />
                <div className="h-1/2 border-[1px] border-gray-300" />
                <Button text="Delete Course" onClick={() => alert("delete")} />
                <Button text="Save & Publish Course" onClick={async () => await publishCourse()} filled />
            </div>

            <div className="flex flex-col h-auto w-1/3 mr-[5%] bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-col mb-6">
                    <div className="text-lg mb-2">Course Title</div>
                    <TextField text={title} onChange={setTitle} placeholder="Course Title"/>
                </div>

                <div className="flex flex-col mb-6">
                    <div className="text-lg mb-2">Description</div>
                    <TextField text={desc} onChange={setDesc} placeholder="Breifly describe course content..."/>
                </div>

                <div className="flex flex-col">
                    <div className="text-lg">Link</div>
                    <div className="text-sm text-gray-600 mb-1">Paste the link to the course here.</div>
                    <TextField text={link} onChange={setLink} placeholder="https://www.example.com"/>
                </div>

                {/* <div className="flex flex-col mb-6">
                    <div className="text-lg">Enroll Learners</div>
                    <div className="text-sm text-gray-600 mb-2">Enrolled learners will see this course appear in their “My Courses” section.</div>
                    <div className="flex flex-col p-3 border-2 border-gray-400 rounded-xl">hello</div>
                </div> */}
            </div>

            <div className="flex flex-col h-auto w-2/3 bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-col mb-6">
                    <div className="text-lg">Verification Methods</div>
                    <div className="text-sm text-gray-600 mb-4">Every course must at least have one verification method.</div>
                    {/* Minimum completion time */}
                    <div className="flex items-start space-x-4 mb-6">
                        <Checkbox checked={useMinCourseTime} setChecked={setUseMinCourseTime} />
                        <div className="flex flex-col">
                            <div className="text-lg">Minimum required course completion time</div>
                            { useMinCourseTime ? 
                            <div className="flex flex-row space-x-2 items-center mt-2">
                                <TextField text={minCourseTime} onChange={setMinCourseTime} style="w-24 text-right"/>
                                <div className="text-lg">minutes</div>
                            </div> : null }
                        </div>
                    </div>
                    {/* Knowledge quiz */}
                    <div className="flex items-start space-x-4">
                        <Checkbox checked={useQuiz} setChecked={setUseQuiz} />
                        <div className="flex flex-col">
                            <div className="text-lg">Completion knowledge quiz</div>
                            { useQuiz ? <div>
                                <div className="flex flex-row space-x-2 items-center mt-2">
                                    <TextField text={quizNum} onChange={setQuizNum} style="w-24 text-right"/>
                                    <div className="text-lg">quiz questions</div>
                                </div>
                                <div className="flex flex-row space-x-2 items-center mt-4">
                                    <TextField text={quizMinScore} onChange={setQuizMinScore} style="w-24 text-right"/>
                                    <div className="text-lg">minimum score needed to pass</div>
                                </div>
                                <div className="flex flex-row space-x-2 items-center mt-4">
                                    <TextField text={quizAttempts} onChange={setQuizAttempts} style="w-24 text-right"/>
                                    <div className="text-lg">quiz attempts allowed</div>
                                </div>
                                <div className="flex items-start space-x-4 mt-4">
                                    <Checkbox checked={useQuizMaxTime} setChecked={setUseQuizMaxTime} />
                                    <div className="flex flex-col">
                                        <div className="text-lg">Maximum quiz completion time</div>
                                        { useQuizMaxTime ? 
                                        <div className="flex flex-row space-x-2 items-center mt-2">
                                            <TextField text={quizMaxTime} onChange={setQuizMaxTime} style="w-24 text-right"/>
                                            <div className="text-lg">minutes</div>
                                        </div> : null }
                                    </div>
                                </div>
                            </div> : null }
                        </div>
                    </div>
                </div>
                { useQuiz ? 
                <div className="text-lg border-2 p-6 rounded-xl">
                    <div className="flex flex-row items-center space-x-2 mb-4">
                        <div>Quiz Questions</div>
                        <div className="text-sm text-gray-500">({quizQuestions.length}/{quizNum} created)</div>
                    </div>
                    <div className="flex flex-col space-y-4">
                        { quizQuestions.map((question, key) => (
                            <QuizQuestion 
                                key={key} 
                                num={key+1} 
                                data={question} 
                                editData={handleEditQuestion} 
                                deleteData={handleDeleteQuestion}
                            />
                        ))}
                        { quizQuestions.length < quizNum ?
                        <button 
                            className="flex flex-row space-x-4 justify-center items-center border-[3px] border-red-800 p-4 rounded-xl text-red-800 font-bold hover:opacity-60 duration-75"
                            onClick={() => setShowCreateQuestion(true)}
                        >
                            Create a new question
                            <MdAdd size={24} />
                        </button> : null }
                    </div>
                </div> : null }
                { showCreateQuestion ? 
                    <CreateQuestion 
                        num={editQuestion}
                        data={ editQuestion != -1 ? quizQuestions[editQuestion] : null }
                        closeModal={() => {setShowCreateQuestion(false); setEditQuesiton(-1)}}
                        setData={handleAddQuestion}
                    /> 
                : null }
            </div>

        </main>
    )
}