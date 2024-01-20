import CompletedCourse from "./CompletedCourse";
import Button from "@/components/Button";
import TextField from "@/components/TextField";

export default function Profile() {

    const TEMP_COMPLETED_COURSE_DATA = [
        { title: "Completed Course", description: "Completed December 25, 2023", id: 1 },
        { title: "Completed Course", description: "Completed January 5, 2024", id: 2 }
    ]

    return (
        <main className="flex justify-center pt-14">
            <div className="flex flex-col h-[80vh] bg-white w-[60%] p-16 rounded-2xl shadow-custom">
                <div className="text-2xl mb-8">Account Details</div>
                <div className="flex flex-col space-y-8">
                    <div className="flex flex-col">
                        <p className="mb-2">Account Email</p>
                        <TextField text="email@gmail.com"/>
                    </div>
                    <div className="flex flex-col">
                        <p className="mb-2">Account Password</p>
                        <TextField text="12345"/>
                        <p>reset password</p>
                    </div>
                    <Button text="Delete Account" link="/home"/>
                </div>
            </div>
            <div className="flex flex-col h-[80vh] bg-white w-[35%] ml-[5%] p-16 rounded-2xl shadow-custom">
                <div className="flex flex-row mb-8">
                    <div className="text-2xl mr-auto">Completed Courses</div>
                </div>
                <div className="flex flex-col justify-between overflow-y-scroll sm:no-scrollbar">
                    {TEMP_COMPLETED_COURSE_DATA.map((course, key) => (
                        <CompletedCourse
                            key={key}
                            title={course.title}
                            date={course.description}
                            id={course.id}
                        />
                    ))}
                </div>
            </div>
        </main>
    )
}
