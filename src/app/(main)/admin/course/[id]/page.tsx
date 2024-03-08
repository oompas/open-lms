"use client"

import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import TextField from "@/components/TextField";
import { useEffect, useState } from "react";
import { MdAdd } from "react-icons/md";
import QuizQuestion from "./QuizQuestion";
import CreateQuestion from "./CreateQuestion";


export default function AdminCourse({ params }: { params: { id: string } }) { 

    const [active, setActive] = useState(false);
    const [activatePopup, setActivatePopup] = useState(false);

    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [link, setLink] = useState("");

    const [useMinCourseTime, setUseMinCourseTime] = useState(false);
    const [minCourseTime, setMinCourseTime] = useState(1);

    const [useQuiz, setUseQuiz] = useState(false)
    const [quizMinScore, setQuizMinScore] = useState(0);
    const [quizAttempts, setQuizAttempts] = useState(1);
    const [useQuizMaxTime, setUseQuizMaxTime] = useState(false);
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

    const handleMoveUp = (num: number) => {
        const temp = [...quizQuestions];
        const qA = temp[num-1];
        temp[num-1] = temp[num-2];
        temp[num-2] = qA;
        setQuizQuestions(temp);
    }

    const handleMoveDown = (num: number) => {
        const temp = [...quizQuestions];
        const qA = temp[num-1];
        temp[num-1] = temp[num];
        temp[num] = qA;
        setQuizQuestions(temp);
    }

    const handlePublish = () => {
        setActive(!active);
        setActivatePopup(false);
    }

    useEffect(() => {
        if (editQuestion != -1)
            setShowCreateQuestion(true)
    }, [editQuestion])

    const activationPopup = ( active ? 
        <div className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">Pressing "Unpublish Course" removes users' access to the course without deleting any data. You can re-publish the course to restore access at any time.</div>
                <div className="flex flex-row space-x-4 mt-6">
                    <Button text="Cancel" onClick={() => setActivatePopup(false)} style="ml-auto"/>
                    <Button text="Unpublish Course" onClick={() => handlePublish()} filled />
                </div>
            </div>
        </div>
        :
        <div className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">Pressing "Publish Course" will allow users of the platform to view, enroll, and complete this course. You can unpublish at any time to remove users' access to the course without losing any data.</div>
                <div>Any subsequent changes saved will be directly visible to users.</div>
                <div className="flex flex-row space-x-4 mt-6">
                    <Button text="Cancel" onClick={() => setActivatePopup(false)} style="ml-auto"/>
                    <Button text="Publish Course" onClick={() => handlePublish()} filled />
                </div>
            </div>
        </div>
    )

    return (
        <main className="flex flex-row justify-center pt-14">
            
            {/* this covers the existing nav buttons in the topbar */}
            <div className="absolute flex flex-row items-center space-x-4 bg-white top-0 right-24 h-32 px-12 text-2xl rounded-b-3xl">
                <Button text={active ? "Unpublish Course" : "Publish Course"} onClick={() => setActivatePopup(true) } />
                <div className="h-1/2 border-[1px] border-gray-300" />
                <Button text="Delete Course" onClick={() => alert("delete")} />
                <Button text="Save Course" onClick={() => alert("publish")} filled />
            </div>

            <div className="flex flex-col h-auto w-1/3 mr-[5%] bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div className={"flex w-fit py-1 px-2 text-sm rounded-xl border-2 "+(active ? "text-[#47AD63] border-[#47AD63]" : "text-[#EEBD31] border-[#EEBD31]")}>
                    {active ? "Active" : "Inactive"}
                </div>
                <div className="text-sm text-gray-600 mt-1 mb-4">{ active ? "Users are able to see and complete this course." : "Users are not able to see this course." }</div>

                <div></div>
                <div className="flex flex-col mb-6">
                    <div className="text-lg mb-2">Course Title</div>
                    <TextField text={title} onChange={setTitle} placeholder="Course Title"/>
                </div>

                <div className="flex flex-col mb-6">
                    <div className="text-lg mb-2">Description</div>
                    <TextField text={desc} onChange={setDesc} placeholder="Breifly describe course content..." area/>
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
                        <div className="text-sm text-gray-500">({quizQuestions.length} questions)</div>
                    </div>
                    <div className="flex flex-col space-y-4">
                        { quizQuestions.map((question, key) => (
                            <QuizQuestion 
                                key={key} 
                                first={key === 0}
                                last={key === quizQuestions.length-1}
                                num={key+1} 
                                data={question} 
                                editData={handleEditQuestion} 
                                deleteData={handleDeleteQuestion}
                                moveUp={handleMoveUp}
                                moveDown={handleMoveDown}
                            />
                        ))}
                        <button 
                            className="flex flex-row space-x-4 justify-center items-center border-[3px] border-red-800 p-4 rounded-xl text-red-800 font-bold hover:opacity-60 duration-75"
                            onClick={() => setShowCreateQuestion(true)}
                        >
                            Create a new question
                            <MdAdd size={24} />
                        </button>
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
                { activatePopup ?
                    activationPopup
                : null }
            </div>

        </main>
    )
}