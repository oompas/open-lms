import ManageCourse from "@/app/(main)/admin/tools/ManageCourse";
import LearnerInsight from "@/app/(main)/admin/tools/LearnerInsight";
import CourseInsight from "@/app/(main)/admin/tools/CourseInsight";
import Button from "@/components/Button";
import SearchBar from "@/components/SearchBar";

// Temporary data for courses that an administrator can edit
const TEMP_MANAGE_COURSE_DATA = [
    { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 10 },
    { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 11 },
    { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 12 },
    { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 13 },
    { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 14 },
    { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 15 },
    { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 16 },
    { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 17 },
    { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 18 },
    { title: "Available Course on OpenLMS Platform", description: "Example course description briefly describing the course contents.", id: 19 }
]

// Temporary data representing all learners
const TEMP_LEARNER_INSIGHT_DATA = [
    { learner: "Learner on OpenLMS Platform", count: 3, id: 10 },
    { learner: "Learner on OpenLMS Platform", count: 4, id: 11 },
    { learner: "Learner on OpenLMS Platform", count: 5, id: 12 },
    { learner: "Learner on OpenLMS Platform", count: 2, id: 13 },
    { learner: "Learner on OpenLMS Platform", count: 6, id: 14 },
    { learner: "Learner on OpenLMS Platform", count: 4, id: 15 },
    { learner: "Learner on OpenLMS Platform", count: 1, id: 16 },
    { learner: "Learner on OpenLMS Platform", count: 7, id: 17 },
    { learner: "Learner on OpenLMS Platform", count: 8, id: 18 },
    { learner: "Learner on OpenLMS Platform", count: 3, id: 19 }
]

// Temporary data representing all courses
const TEMP_COURSE_INSIGHT_DATA = [
    { title: "Available Course on OpenLMS Platform", count: 3, time: 30, score: 60, id: 10 },
    { title: "Available Course on OpenLMS Platform", count: 4, time: 30, score: 60, id: 11 },
    { title: "Available Course on OpenLMS Platform", count: 5, time: 30, score: 60, id: 12 },
    { title: "Available Course on OpenLMS Platform", count: 2, time: 30, score: 60, id: 13 },
    { title: "Available Course on OpenLMS Platform", count: 6, time: 30, score: 60, id: 14 },
    { title: "Available Course on OpenLMS Platform", count: 4, time: 30, score: 60, id: 15 },
    { title: "Available Course on OpenLMS Platform", count: 1, time: 30, score: 60, id: 16 },
    { title: "Available Course on OpenLMS Platform", count: 7, time: 30, score: 60, id: 17 },
    { title: "Available Course on OpenLMS Platform", count: 8, time: 30, score: 60, id: 18 },
    { title: "Available Course on OpenLMS Platform", count: 3, time: 30, score: 60, id: 19 }
]

export default function Tools() {
    return (
        <main className="flex-col justify-center items-center pt-14">
            {/* Manage courses section */}
            <div className="flex flex-col h-[60vh] bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-row justify-between items-center mb-2">
                    <div className="flex flex-col">
                        <div className="text-2xl mb-2">Manage Courses</div>
                        <p className="mb-0 mr-2">Click on a course to navigate to course update screen.</p>
                    </div>
                    <div className="flex flex-row justify-end">
                        <Button text="Create a Course" link="/home"/>
                        <SearchBar style="ml-4"/>
                    </div>
                </div>
                <div className="flex flex-wrap justify-start overflow-y-scroll sm:no-scrollbar">
                    {TEMP_MANAGE_COURSE_DATA.map((course, key) => (
                        <ManageCourse
                            key={key}
                            title={course.title}
                            description={course.description}
                            id={course.id}
                        />
                    ))}
                </div>
            </div>

            {/* Learner insights section */}
            <div className="flex flex-col h-[50vh] bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-row justify-end items-center mb-2">
                    <div className="text-2xl mb-2 mr-auto">Learner Insights</div>
                    <Button text="Invite a Learner" link="/home"/>
                    <Button text="Download User Reports" link="/home" style="ml-4"/>
                </div>
                <div className="flex flex-wrap justify-start overflow-y-scroll sm:no-scrollbar">
                    <table className="border-collapse border w-full">
                        <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Name</th>
                            <th className="border p-2">Number of Completed Courses</th>
                        </tr>
                        </thead>
                        <tbody>
                        {TEMP_LEARNER_INSIGHT_DATA.map((learner, key) => (
                            <tr key={learner.id} className="border">
                                <td className="border p-2">
                                    <LearnerInsight
                                        key={key}
                                        learner={learner.learner}
                                        count={learner.count}
                                        id={learner.id}
                                    />
                                </td>
                                <td className="border p-2">{learner.count}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Course insights section */}
            <div className="flex flex-col h-[50vh] bg-white p-16 rounded-2xl shadow-custom">
                <div className="flex flex-row justify-end items-center mb-2">
                    <div className="text-2xl mb-2 mr-auto">Course Insights</div>
                    <Button text="Download Course Reports" link="/home"/>
                </div>
                <div className="flex flex-wrap justify-start overflow-y-scroll sm:no-scrollbar">
                    <table className="border-collapse border w-full">
                        <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Course Name</th>
                            <th className="border p-2">Percentage of Learners Completed</th>
                            <th className="border p-2">Average Completion Time</th>
                            <th className="border p-2">Average Quiz Score</th>
                        </tr>
                        </thead>
                        <tbody>
                        {TEMP_COURSE_INSIGHT_DATA.map((course, key) => (
                            <tr key={course.id} className="border">
                                <td className="border p-2">
                                    <CourseInsight
                                        key={key}
                                        title={course.title}
                                        count={course.count}
                                        time={course.time}
                                        score={course.score}
                                        id={course.id}
                                    />
                                </td>
                                <td className="border p-2">{course.count}/10</td>
                                <td className="border p-2">{course.time} minutes</td>
                                <td className="border p-2">{course.score}%</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    )
}
