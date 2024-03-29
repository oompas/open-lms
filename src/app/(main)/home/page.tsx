"use client";
import EnrolledCourse from "./EnrolledCourse";
import "../../../config/firebase";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import { ApiEndpoints, useAsyncApiCall } from "@/config/firebase";

export default function Home() {

    const router = useRouter();

    const courses = useAsyncApiCall(ApiEndpoints.GetAvailableCourses, {});

    const enrolledCourses = () => {
        if (courses.loading) {
            return <div>Loading...</div>;
        }
        if (courses.error) {
            return <div>Error loading courses</div>;
        }
        // @ts-ignore
        if (courses.result?.data.filter((course: any) => course.status !== 1).length === 0) {
            return <div className="text-gray-600 text-center">Enroll in courses to get started!</div>
        }
        // @ts-ignore
        var temp_courses = [...courses.result.data.filter((course: any) => course.status !== 1)]
        if (temp_courses.length % 3 === 2) {
            temp_courses.push({name: "_placeholder", status: "", description: "", id: 0})
            temp_courses.push({name: "_placeholder", status: "", description: "", id: 0})
        } else if (temp_courses.length % 3 === 1) {
            temp_courses.push({name: "_placeholder", status: "", description: "", id: 0})
        }

        return temp_courses.map((course: any, key: number) => {

                let time = "";
                if (course.minTime) {
                    if (course.minTime >= 60) {
                        time += `${Math.floor(course.minTime / 60)}hr `;
                    }
                    if (course.minTime % 60 !== 0) {
                        time += `${course.minTime % 60}min`;
                    }
                    time += " learning ";
                }
                if (course.maxQuizTime) {
                    time += time.length > 0 ? " + " : "";
                    if (course.maxQuizTime >= 60) {
                        time += `${Math.floor(course.maxQuizTime / 60)}hr `;
                    }
                    if (course.maxQuizTime % 60 !== 0) {
                        time += `${course.maxQuizTime % 60}min`;
                    }
                    time += " quiz";
                }

                return (
                    <EnrolledCourse
                        key={key}
                        title={course.name}
                        status={course.status }
                        description={course.description}
                        time={time}
                        id={course.id}
                    />
                );
            });
    }

    return (
        <main className="flex w-full justify-center mb-4">
            <div className="flex flex-col bg-white w-full p-12 rounded-2xl shadow-custom">
                <div className="flex flex-row items-center mb-2">
                    <div className="text-lg">My Enrolled Courses</div>
                    <Button text="Browse Available Courses" onClick={() => router.push("/course_search")} style="ml-auto" />
                </div>
                <div className="flex flex-row flex-wrap justify-between mt-4 overflow-y-scroll sm:no-scrollbar">
                    {enrolledCourses()}
                </div>
            </div>
        </main>
    )
}
