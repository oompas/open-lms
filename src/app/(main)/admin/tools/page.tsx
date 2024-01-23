import ManageCourse from "@/app/(main)/admin/tools/ManageCourse";
import TextField from "@/components/TextField";
import Button from "@/components/Button";
import SearchBar from "@/components/SearchBar";

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

export default function Tools() {
    return (
        <main className="flex-col justify-center items-center pt-14">
            <div className="flex flex-col h-[50vh] bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div className="text-2xl mb-2">Manage Courses</div>
                <div className="flex flex-row justify-between items-start mb-2">
                    <p className="mb-0 mr-2">Click on a course to navigate to course update screen.</p>
                    <div className="flex flex-row">
                        <Button text="Create a Course" link="/home"/>
                        <SearchBar/>
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
            <div className="flex flex-col h-[50vh] bg-white p-16 rounded-2xl shadow-custom mb-8">
                <div className="text-2xl mb-8">Learner Insights</div>
                {/* Add your content for the second section here */}
            </div>
            <div className="flex flex-col h-[50vh] bg-white p-16 rounded-2xl shadow-custom">
                <div className="text-2xl mb-8">Course Insights</div>
                {/* Add your content for the second section here */}
            </div>
        </main>
    )
}
