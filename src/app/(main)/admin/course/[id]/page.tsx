"use client"
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import TextField from "@/components/TextField";
import { useEffect, useState } from "react";
import { MdAdd, MdDelete } from "react-icons/md";
import QuizQuestion from "./QuizQuestion";
import CreateQuestion from "./CreateQuestion";
import { useRouter } from "next/navigation";
import { callAPI } from "@/helpers/supabase.ts";
import { BiSolidHide } from "react-icons/bi";
import { GrUpdate } from "react-icons/gr";
import { IoMdEye } from "react-icons/io";
import { IoCreate } from "react-icons/io5";

export default function AdminCourse({ params }: { params: { id: string } }) {

    const newCourse = params.id === "new";
    const router = useRouter();

    const [originalName, setOriginalName] = useState(params.id === "new" ? "New course" : "");

    const [loading, setLoading] = useState(!newCourse);
    const [activatePopup, setActivatePopup] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false);
    const [deletePopupConfirm, setDeletePopupConfirm] = useState("");

    const [active, setActive] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [link, setLink] = useState("");

    const [minCourseTime, setMinCourseTime] = useState<null | number>(null);

    const [quizMinScore, setQuizMinScore] = useState<string | number>(0);
    const [quizAttempts, setQuizAttempts] = useState<null | number>(1);
    const [quizMaxTime, setQuizMaxTime] = useState<null | number>(60);
    const [preserveOrder, setPreserveOrder] = useState<boolean>(true);

    const [showCreateQuestion, setShowCreateQuestion] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
    const [quizTotalScore, setQuizTotalScore] = useState(0);
    const [editQuestion, setEditQuestion] = useState(-1);
    const [showAddCourseErrorPopup, setShowAddCourseErrorPopup] = useState(false);
    const [addCourseErrorPopupMsg, setShowAddCourseErrorPopupMsg] = useState("");

    const toNumber = (val: string | number | null) => val === null ? null : Number(val);

    const handleAddQuestion = (num: number, data: any) => {
        // called by "save question" in create question modal
        const temp = [...quizQuestions];
        if (num != -1)
            temp[num] = data;
        else
            temp.push(data);

        let temp_score = 0;
        temp.map((q) => (
            temp_score += q.marks
        ))
        setQuizTotalScore(temp_score);
        setQuizQuestions(temp);
        setEditQuestion(-1);
        setShowCreateQuestion(false);
    }

    const handleEditQuestion = (num: number) => {
        setEditQuestion(num - 1)
    }

    const handleDeleteQuestion = (num: number) => {
        // TODO - question delete confirmation
        const temp = [...quizQuestions];
        temp.splice(num - 1, 1);
        let temp_score = 0;
        temp.map((q) => (
            temp_score += q.marks
        ))
        setQuizQuestions(temp);
        setQuizTotalScore(temp_score);
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

        callAPI('get-course-data-admin', { courseId: parseInt(params.id) })
            .then((result) => {
                const data: any = result.data;

                // Set course & quiz info on page
                setOriginalName(data.name);
                setName(data.name);
                setDesc(data.description);
                setLink(data.link);
                setMinCourseTime(data.minTime);
                setActive(data.active);

                if (data.quizData !== null) {
                    setQuizMinScore(data.quizData.minScore);
                    setQuizAttempts(data.quizData.maxAttempts);
                    setQuizMaxTime(data.quizData.timeLimit);

                    setQuizTotalScore(data.quizQuestions?.reduce((acc: number, q: any) => acc + q.marks, 0));

                    if (data.quizQuestions && data.quizQuestions[0].order) {
                        data.quizQuestions.sort((a: any, b: any) => a.order - b.order);
                    }
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

    const saveCourse = async () => {

        const courseData = {
            ...(!newCourse && { previousVersionId: params.id }),
            name: name,
            description: desc,
            link: link,
            minTime: toNumber(minCourseTime),

            maxQuizAttempts: toNumber(quizAttempts),
            minQuizScore: toNumber(quizMinScore),
            quizTimeLimit: toNumber(quizMaxTime),
            preserveQuizQuestionOrder: preserveOrder,
        }
        const quizQuestionData = quizQuestions.map(({ id, ...rest }) => rest);

        try {
            await callAPI('create-course', { course: courseData, quizQuestions: quizQuestionData })
                .then((result) => router.push(`/admin/course/${result.data}`));
        } catch (error: any) {
            const errorMessage = error.toString().split(':').slice(-1)[0].trim();
            setShowAddCourseErrorPopup(true);
            setShowAddCourseErrorPopupMsg("Error adding/updating course. Please try again. " + errorMessage);
        }
    }

    const handlePublish = async () => {
        await callAPI('set-course-visibility', { courseId: parseInt(params.id), active: !active })
            .then(() => { setActive(!active); setActivatePopup(false); })
            .catch((err) => console.log(`Error unpublishing course: ${err}`));
    }

    const handleDelete = async () => {
        // TODO
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

    const savePopup = (
        <div
            className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    <b>{newCourse ? "Add course" : "Update course"}</b>
                    <p className="mt-2">
                        {newCourse
                            ? <>Adding a new course will create a new course with the specified details, but <b>it will
                                not be visible to users yet</b>. Once added, you need to publish the course using the
                                button that will appear on the top menu</>
                            : <>To avoid issues with course stats and data, updating a course will <b>create a new course
                                and retire the old course</b>. The old course cannot be attempted again, but data for
                                the old course is still kept so users can still see they're completed the old version</>
                        }
                    </p>
                </div>
                <div className="flex flex-row space-x-4 mt-6">
                    <Button text="Cancel" onClick={() => setShowSavePopup(false)} style="ml-auto"/>
                    <Button
                        text={newCourse ? "Add course" : "Update course"}
                        onClick={async () => await saveCourse()}
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

    const addCourseErrorPopup = (
        <div className="fixed flex justify-center items-center w-full h-full top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    {addCourseErrorPopupMsg}
                </div>
                <div className="flex flex-row space-x-4 mt-6">
                    <Button text="OK" onClick={() => setShowAddCourseErrorPopup(false)} filled />
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full">
            <div className="flex justify-between w-full bg-white p-12 rounded-2xl shadow-custom mb-4">
                <div className={"text-3xl" + (params.id === "new" ? " italic" : "")}>
                    {originalName}
                </div>

                <div className="flex">
                    <div
                        className={"flex w-fit pt-1.5 px-2 text-sm rounded-xl border-2 " + (active ? "text-[#47AD63] border-[#47AD63]" : "text-[#EEBD31] border-[#EEBD31]")}
                    >
                        {active ? "Active" : "Inactive"}
                    </div>

                    {!newCourse && (
                        active
                            ? <BiSolidHide size={25} className="ml-4 mt-1 cursor-pointer" onClick={() => setActivatePopup(true)}/>
                            : <IoMdEye size={25} className="ml-4 mt-1 cursor-pointer" onClick={() => setActivatePopup(true)}/>
                    )}
                    <MdDelete size={25} className="ml-3 mt-1 cursor-pointer" onClick={() => newCourse ? router.push("/admin/tools") : setShowDeletePopup(true)}/>
                    {
                        newCourse
                            ? <MdAdd size={25} className="ml-3 mt-[5px] cursor-pointer" onClick={async () => setShowSavePopup(true)}/>
                            : <GrUpdate size={22} className="ml-3 mt-[5px] cursor-pointer" onClick={async () => setShowSavePopup(true)}/>
                    }
                </div>
            </div>

            <div className="flex flex-row w-full h-full justify-center pb-[2vh]">
                <div className="flex flex-col h-auto w-1/3 mr-[2%] bg-white p-14 rounded-2xl shadow-custom mb-8">
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
                </div>

                <div className="flex flex-col w-2/3 h-fit bg-white p-14 rounded-2xl shadow-custom mb-8">
                    <div className="flex flex-col mb-6">
                        <div className="text-lg">Verification Methods</div>
                        <div className="text-sm text-gray-600 mb-4">Every course must have a knowledge quiz. Minimum time is optional.
                        </div>

                        {/* Minimum completion time */}
                        <div className="flex items-start space-x-4 mb-6">
                            <Checkbox
                                checked={minCourseTime !== null}
                                setChecked={() => setMinCourseTime(minCourseTime === null ? 60 : null)}
                            />
                            <div className="flex flex-col">
                                <div className="text-lg">Minimum time spent completing course</div>
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
                            <Checkbox checked={true} disabled={true}/>
                            <div className="flex flex-col">
                                <div className="text-lg">Knowledge quiz completion</div>
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
                                                            setQuizMinScore(1);
                                                            return;
                                                        }
                                                        if (!(/^[1-9]+$/).test(text)) {
                                                            setQuizMinScore(1);
                                                            return;
                                                        }
                                                        if (Number(text) <= 0) {
                                                            setQuizMinScore(1);
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
                                            setChecked={() => setQuizMaxTime(quizMaxTime === null ? 60 : null)}
                                        />
                                        <div className="flex flex-col">
                                            <div className="text-lg">Maximum quiz time</div>
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
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <div className="text-lg border-2 p-6 rounded-xl">
                            <div className="flex flex-row items-center space-x-2 mb-4">
                                <div>Quiz Questions</div>
                                <div className="text-sm text-gray-500">({quizQuestions?.length} questions)</div>
                            </div>
                            <div className="flex flex-col space-y-4">
                                {quizQuestions?.map((question, key) => (
                                    <QuizQuestion
                                        key={key}
                                        first={key === 0}
                                        last={key === quizQuestions?.length - 1}
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
                    </div>

                    {activatePopup && activationPopup}
                    {showDeletePopup && deletePopup}
                    {showSavePopup && savePopup}
                    {loading && loadingPopup}
                    {showAddCourseErrorPopup && addCourseErrorPopup}
                    {showCreateQuestion &&
                        <CreateQuestion
                            num={editQuestion}
                            data={editQuestion != -1 ? quizQuestions[editQuestion] : null}
                            closeModal={() => {
                                setShowCreateQuestion(false);
                                setEditQuestion(-1)
                            }}
                            setData={handleAddQuestion}
                        />
                    }
                </div>
            </div>
        </div>
    )
}
