"use client"
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import TextField from "@/components/TextField";
import { useEffect, useState } from "react";
import { MdAdd } from "react-icons/md";
import QuizQuestion from "./QuizQuestion";
import CreateQuestion from "./CreateQuestion";
import { callApi } from "@/config/firebase";
import { useRouter } from "next/navigation"; // @ts-ignore

export default function AdminCourse({ params }: { params: { id: string } }) {

    const newCourse = params.id === "new";
    const router = useRouter();

    const [loading, setLoading] = useState(!newCourse);
    const [activatePopup, setActivatePopup] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deletePopupConfirm, setDeletePopupConfirm] = useState("");

    const [active, setActive] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [link, setLink] = useState("");

    const [minCourseTime, setMinCourseTime] = useState<null | number>(null);

    const [useQuiz, setUseQuiz] = useState(true)
    const [quizMinScore, setQuizMinScore] = useState<string | number>(0);
    const [quizAttempts, setQuizAttempts] = useState<null | number>(null);
    const [quizMaxTime, setQuizMaxTime] = useState<null | number>(null);
    const [preserveOrder, setPreserveOrder] = useState<boolean>(true);

    const [showCreateQuestion, setShowCreateQuestion] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
    const [quizTotalScore, setQuizTotalScore] = useState(0);
    const [editQuestion, setEditQuesiton] = useState(-1);

    const toNumber = (val: string | number | null) => val === null ? null : Number(val);

    const handleAddQuestion = (num: number, data: any) => {
        // called by "save question" in create question modal
        const temp = [...quizQuestions];
        if (num != -1)
            temp[num] = data;
        else
            temp.push(data);

        var temp_score = 0;
        temp.map((q) => (
            temp_score += q.marks
        ))
        setQuizTotalScore(temp_score);
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
        if (!loading || newCourse) return;

        callApi("getCourseInfo", { courseId: params.id, withQuiz: true })
            .then((result) => {
                const data: any = result.data;

                // Set course & quiz info on page
                setName(data.name);
                setDesc(data.description);
                setLink(data.link);
                setMinCourseTime(data.minTime);
                setActive(data.active);

                setUseQuiz(data.quiz !== null);
                if (data.quiz !== null) {
                    setQuizMinScore(data.quiz.minScore);
                    setQuizAttempts(data.quiz.maxAttempts);
                    setQuizMaxTime(data.quiz.timeLimit);

                    setQuizTotalScore(data.quizQuestions.reduce((acc: number, q: any) => acc + q.marks, 0));

                    setQuizQuestions(data.quizQuestions);
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
            ...(!newCourse && { previousVersionId: params.id }),
            name: name,
            description: desc,
            link: link,
            minTime: toNumber(minCourseTime),
            quiz: !useQuiz ? null : {
                minScore: toNumber(quizMinScore),
                maxAttempts: toNumber(quizAttempts),
                timeLimit: toNumber(quizMaxTime),
                preserveOrder: preserveOrder,
            },
            quizQuestions: !quizQuestions.length ? null : quizQuestions.map(({ id, ...rest }) => rest)
        }

        await callApi("addCourse", courseData).then((result) => router.push(`/admin/course/${result.data}`));
    }

    const handlePublish = async () => {
        await callApi("setCourseVisibility", { courseId: params.id, active: !active })
            .then(() => { setActive(!active); setActivatePopup(false); })
            .catch((err) => console.log(`Error unpublishing course: ${err}`));
    }

    const handleDelete = async () => {
        await callApi("deleteCourse", { courseId: params.id })
            .then(() => router.push("/admin/tools"))
            .catch((err) => console.log(`Error deleting course: ${err}`));
    }

    const activationPopup = (
        <div
            className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    {active
                        ? "Pressing \"Unpublish Course\" makes the course hidden to learners, but does not change" +
                        " any course related data (user's course attempts are kept). You can still view the course," +
                        " or re-publish it at any time to restore access."
                        : "\"Publish Course\" will make this course visible to learners so they may view and complete" +
                        " the course. This does not change any other course-related data, and you may unpublish it" +
                        " at any time."
                    }
                </div>
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

    const deletePopup = (
        <div
            className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    <b>WARNING!</b>
                    <p className="mt-2">
                        Deleting this course will <b>permanently delete <u>all</u> course data</b>, including learner's
                        course attempts. Users (including admins) will not be able to see the course, access course stats
                        or access any previous history of course completion. {" "}
                        <u><b>This action is irreversible!</b></u>
                    </p>
                    <p className="mt-2">
                        <i>If you want to hide the course from view, you can unpublish the course instead.</i>
                    </p>
                </div>
                <div className={"mt-4"}>
                    Type <i>I understand '{name}' will be permanently deleted</i> to confirm you understand:
                </div>
                <input
                    className="border-2 border-gray-400 rounded-xl p-2 mt-2"
                    value={deletePopupConfirm}
                    onChange={(e) => setDeletePopupConfirm(e.target.value)}
                />
                <div className="flex flex-row space-x-4 mt-6">
                    <Button text="Cancel" onClick={() => setShowDeletePopup(false)} style="ml-auto"/>
                    <Button
                        text={deletePopupConfirm === `I understand '${name}' will be permanently deleted` ? "Permanently Delete Course" : "Please confirm above"}
                        onClick={async () => await handleDelete()}
                        filled
                        disabled={deletePopupConfirm !== `I understand '${name}' will be permanently deleted`}
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
        <div className="flex flex-row w-full h-full justify-center pb-[2vh]">

            {/* this covers the existing nav buttons in the topbar */}
            <div
                className="absolute flex flex-row items-center space-x-4 bg-white top-0 right-24 h-[13vh] px-12 text-2xl rounded-b-3xl">
                {!newCourse &&
                    <>
                        <Button
                            text={active ? "Unpublish Course" : "Publish Course"}
                            onClick={() => setActivatePopup(true)}
                        />
                        <div className="h-1/2 border-[1px] border-gray-300"/>
                    </>
                }
                <Button
                    text={newCourse ? "Discard changes" : "Delete course"}
                    onClick={() => newCourse ? router.push("/admin/tools") : setShowDeletePopup(true)}
                />
                <Button
                    text={newCourse ? "Create course" : "Update course"}
                    onClick={async () => await addCourse()}
                    filled
                />
            </div>

            <div className="flex flex-col h-auto w-1/3 mr-[2%] bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div
                    className={"flex w-fit py-1 px-2 text-sm rounded-xl border-2 " + (active ? "text-[#47AD63] border-[#47AD63]" : "text-[#EEBD31] border-[#EEBD31]")}>
                    {active ? "Active" : "Inactive"}
                </div>
                <div
                    className="text-sm text-gray-600 mt-1 mb-4">{active ? "Users are able to see and complete this course." : "Users are not able to see this course."}</div>

                <div></div>
                <div className="flex flex-col mb-6">
                    <div className="text-lg mb-2">Course Name</div>
                    <TextField text={name} onChange={setName} placeholder="Course Name"/>
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

            <div className="flex flex-col w-2/3 h-fit bg-white p-16 rounded-2xl shadow-custom mb-8">
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
                                        <div className="flex flex-col">
                                            <div className="text-lg">Minimum quiz score</div>
                                            <div className="flex flex-row space-x-2 items-center mt-2">
                                                <TextField
                                                    text={quizMinScore}
                                                    onChange={(text: string) => {
                                                        if (text === "") {
                                                            setQuizMinScore(0);
                                                            return;
                                                        }
                                                        if (!(/^[0-9]+$/).test(text)) {
                                                            return;
                                                        }
                                                        if (Number(text) > quizTotalScore) {
                                                            setQuizMinScore(quizTotalScore);
                                                            return;
                                                        }
                                                        return setQuizMinScore(Number(text));
                                                    }}
                                                    style="w-24 text-right"
                                                />
                                                <div className="text-lg">
                                                    / {quizTotalScore}
                                                </div>
                                            </div>
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

                                    { /* Preserve order */}
                                    <div className="flex items-start space-x-4 mt-4">
                                        <Checkbox
                                            checked={preserveOrder}
                                            setChecked={setPreserveOrder}
                                        />
                                        <div className="flex flex-col">
                                            <div className="text-lg">Preserve question order</div>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <div className="flex flex-col">
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
                                        inData={question}
                                        editData={handleEditQuestion}
                                        deleteData={handleDeleteQuestion}
                                        moveUp={handleMoveUp}
                                        moveDown={handleMoveDown}
                                        preserveOrder={preserveOrder}
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
                {showDeletePopup && deletePopup}
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
