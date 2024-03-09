"use client"
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import TextField from "@/components/TextField";
import { useEffect, useState } from "react";
import { MdAdd } from "react-icons/md";
import QuizQuestion from "./QuizQuestion";
import CreateQuestion from "./CreateQuestion";
import { callApi } from "@/config/firebase";
import { useRouter } from "next/navigation";
import { useAsync } from "react-async-hook";

export default function AdminCourse({ params }: { params: { id: string } }) {

    const newCourse = params.id === "new";
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [activatePopup, setActivatePopup] = useState(false);

    const [active, setActive] = useState(false);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [link, setLink] = useState("");

    const [minCourseTime, setMinCourseTime] = useState<null | number>(null);

    const [useQuiz, setUseQuiz] = useState(true)
    const [quizMinScore, setQuizMinScore] = useState<null | number>(null);
    const [quizAttempts, setQuizAttempts] = useState<null | number>(null);
    const [quizMaxTime, setQuizMaxTime] = useState<null | number>(null);

    const [showCreateQuestion, setShowCreateQuestion] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
    const [editQuestion, setEditQuesiton] = useState(-1);

    const handleAddQuestion = (num: number, data: any) => {
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
        setEditQuesiton(num - 1)
    }

    const handleDeleteQuestion = (num: number) => {
        // TODO - question delete confirmation
        const temp = [...quizQuestions];
        temp.splice(num - 1, 1);
        setQuizQuestions(temp);
    }

    const handleMoveUp = (num: number) => {
        const temp = [...quizQuestions];
        const qA = temp[num - 1];
        temp[num - 1] = temp[num - 2];
        temp[num - 2] = qA;
        setQuizQuestions(temp);
    }

    const handleMoveDown = (num: number) => {
        const temp = [...quizQuestions];
        const qA = temp[num - 1];
        temp[num - 1] = temp[num];
        temp[num] = qA;
        setQuizQuestions(temp);
    }

    useEffect(() => {
        if (!loading) return;

        callApi("getCourseInfo")({ courseId: params.id })
            .then((result) => {
                const data: any = result.data;
                setTitle(data.name);
                setDesc(data.description);
                setLink(data.link);
                setActive(data.active);

                if (data.quiz !== null) {
                    setUseQuiz(true);
                    setQuizMinScore(data.quiz.minScore);
                    setQuizAttempts(data.quiz.maxAttempts);
                    setQuizMaxTime(data.quiz.timeLimit);
                }

                setLoading(false);
            })
            .catch((err) => console.log(`Error fetching course data: ${err}`));
    }, [loading]);

    useEffect(() => {
        if (editQuestion != -1)
            setShowCreateQuestion(true)
    }, [editQuestion]);

    const addCourse = async () => {

        const courseData = {
            name: title,
            description: desc,
            link: link,
            minTime: minCourseTime === null ? null : Number(minCourseTime),
        }

        const courseId = await callApi("addCourse")(courseData).then((result) => result.data);

        if (useQuiz) {
            const quizData = {
                courseId: courseId,
                metaData: {
                    minScore: quizMinScore === null ? null : Number(quizMinScore),
                    maxAttempts: quizAttempts === null ? null : Number(quizAttempts),
                    timeLimit: quizMaxTime === null ? null : Number(quizMaxTime),
                },
                questions: quizQuestions.map((q) => ({correctAnswer: 1, ...q})),
            }

            await callApi("addQuiz")(quizData);
        }

        router.push(`/admin/course/${courseId}`);
    }

    const updateCourse = async () => {
        const courseData = {
            courseId: params.id,
            name: title,
            description: desc,
            link: link,
            minTime: minCourseTime === null ? null : Number(minCourseTime),
        }

        await callApi("updateCourse")(courseData);

        if (useQuiz) {
            const quizData = {
                courseId: params.id,
                metaData: {
                    minScore: quizMinScore === null ? null : Number(quizMinScore),
                    maxAttempts: quizAttempts === null ? null : Number(quizAttempts),
                    timeLimit: quizMaxTime === null ? null : Number(quizMaxTime),
                },
                questions: quizQuestions.map((q) => ({correctAnswer: 1, ...q})),
            }

            await callApi("updateQuiz")(quizData);
        }
    }

    const handlePublish = async () => {
        if (active) {
            await callApi("unPublishCourse")( { courseId: params.id })
                .then(() => setActive(false))
                .catch((err) => console.log(`Error unpublishing course: ${err}`));
        } else {
            await callApi("publishCourse")({ courseId: params.id })
                .then(() => setActive(true))
                .catch((err) => console.log(`Error publishing course: ${err}`));
        }

        setActive(!active);
        setActivatePopup(false);
    }

    const activationPopup = (
        <div
            className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    {active
                        ? "Pressing \"Unpublish Course\" removes users' access to the course\n without deleting any" +
                        " data. You can re-publish the course to restore access at any time."
                        : "\"Publish Course\" will allow users of the platform to view, without deleting any data." +
                        " You can re-publish the course to restore access at any time. enroll, and complete this" +
                        " course. You can unpublish at any time to remove users' access to the course without losing any data"
                    }
                </div>
                {!active && <div>Any subsequent changes saved will be directly visible to users.</div>}
                <div className="flex flex-row space-x-4 mt-6">
                <Button text="Cancel" onClick={() => setActivatePopup(false)} style="ml-auto"/>
                    <Button
                        text={(active ? "Unpublish" : "Publish") + " Course"}
                        onClick={async () => await handlePublish()}
                        filled
                    />
                </div>
            </div>
        </div>
    );

    const loadingPopup = (
        <div
            className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    Loading course data...
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex flex-row justify-center pt-14">

            {/* this covers the existing nav buttons in the topbar */}
            <div
                className="absolute flex flex-row items-center space-x-4 bg-white top-0 right-24 h-32 px-12 text-2xl rounded-b-3xl">
                {!newCourse &&
                    <>
                        <Button text={active ? "Unpublish Course" : "Publish Course"}
                                onClick={() => setActivatePopup(true)}/>
                        <div className="h-1/2 border-[1px] border-gray-300"/>
                    </>
                }
                <Button
                    text={newCourse ? "Discard changes" : "Delete course"}
                    onClick={() => alert("delete")}
                />
                <Button
                    text={newCourse ? "Create course" : "Update course"}
                    onClick={async () => newCourse ? await addCourse() : await updateCourse()}
                    filled
                />
            </div>

            <div className="flex flex-col h-auto w-1/3 mr-[5%] bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div
                    className={"flex w-fit py-1 px-2 text-sm rounded-xl border-2 " + (active ? "text-[#47AD63] border-[#47AD63]" : "text-[#EEBD31] border-[#EEBD31]")}>
                    {active ? "Active" : "Inactive"}
                </div>
                <div
                    className="text-sm text-gray-600 mt-1 mb-4">{active ? "Users are able to see and complete this course." : "Users are not able to see this course."}</div>

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
                    <div className="text-sm text-gray-600 mb-4">Every course must at least have one verification
                        method.
                    </div>

                    {/* Minimum completion time */}
                    <div className="flex items-start space-x-4 mb-6">
                        <Checkbox
                            checked={minCourseTime !== null}
                            setChecked={() => setMinCourseTime(minCourseTime === null ? 1 : null)}
                        />
                        <div className="flex flex-col">
                            <div className="text-lg">Minimum required course completion time</div>
                            {minCourseTime !== null &&
                                <div className="flex flex-row space-x-2 items-center mt-2">
                                    <TextField text={minCourseTime} onChange={setMinCourseTime}
                                               style="w-24 text-right"/>
                                    <div className="text-lg">minutes</div>
                                </div>
                            }
                        </div>
                    </div>

                    {/* Knowledge quiz */}
                    <div className="flex items-start space-x-4">
                        <Checkbox checked={useQuiz} setChecked={setUseQuiz}/>
                        <div className="flex flex-col">
                            <div className="text-lg">Completion knowledge quiz</div>
                            {useQuiz &&
                                <div>
                                    { /* Min score */}
                                    <div className="flex items-start space-x-4 mt-4">
                                        <Checkbox
                                            checked={quizMinScore !== null}
                                            setChecked={() => setQuizMinScore(quizMinScore === null ? 1 : null)}
                                        />
                                        <div className="flex flex-col">
                                            <div className="text-lg">Minimum quiz score</div>
                                            {quizMinScore !== null &&
                                                <div className="flex flex-row space-x-2 items-center mt-2">
                                                    <TextField
                                                        text={quizMinScore}
                                                        onChange={setQuizMinScore}
                                                        style="w-24 text-right"
                                                    />
                                                    <div className="text-lg">
                                                        correct
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </div>

                                    { /* Max quiz attempts */}
                                    <div className="flex items-start space-x-4 mt-4">
                                        <Checkbox
                                            checked={quizAttempts !== null}
                                            setChecked={() => setQuizAttempts(quizAttempts === null ? 1 : null)}
                                        />
                                        <div className="flex flex-col">
                                            <div className="text-lg">Maximum attempts allowed</div>
                                            {quizAttempts &&
                                                <div className="flex flex-row space-x-2 items-center mt-2">
                                                    <TextField
                                                        text={quizAttempts}
                                                        onChange={setQuizAttempts}
                                                        style="w-24 text-right"
                                                    />
                                                    <div className="text-lg">
                                                        attempt{quizAttempts === 1 ? "" : "s"}
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </div>

                                    { /* Max quiz time */}
                                    <div className="flex items-start space-x-4 mt-4">
                                        <Checkbox
                                            checked={quizMaxTime !== null}
                                            setChecked={() => setQuizMaxTime(quizMaxTime === null ? 1 : null)}
                                        />
                                        <div className="flex flex-col">
                                            <div className="text-lg">Maximum quiz completion time</div>
                                            {quizMaxTime !== null &&
                                                <div className="flex flex-row space-x-2 items-center mt-2">
                                                    <TextField
                                                        text={quizMaxTime}
                                                        onChange={setQuizMaxTime}
                                                        style="w-24 text-right"
                                                    />
                                                    <div className="text-lg">
                                                        minute{quizMaxTime === 1 ? "" : "s"}
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <div>
                    {useQuiz &&
                        <div className="text-lg border-2 p-6 rounded-xl">
                            <div className="flex flex-row items-center space-x-2 mb-4">
                                <div>Quiz Questions</div>
                                <div className="text-sm text-gray-500">({quizQuestions.length} questions)</div>
                            </div>
                            <div className="flex flex-col space-y-4">
                                {quizQuestions.map((question, key) => (
                                    <QuizQuestion
                                        key={key}
                                        first={key === 0}
                                        last={key === quizQuestions.length - 1}
                                        num={key + 1}
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
                                    <MdAdd size={24}/>
                                </button>
                            </div>
                        </div>
                    }
                </div>
                {activatePopup && activationPopup}
                {loading && loadingPopup}
                {showCreateQuestion &&
                    <CreateQuestion
                        num={editQuestion}
                        data={editQuestion != -1 ? quizQuestions[editQuestion] : null}
                        closeModal={() => {
                            setShowCreateQuestion(false);
                            setEditQuesiton(-1)
                        }}
                        setData={handleAddQuestion}
                    />
                }
            </div>
        </div>
    )
}
