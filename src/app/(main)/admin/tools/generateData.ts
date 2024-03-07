import { getFunctions, httpsCallable } from "firebase/functions";

interface course {
    name: string,
    description: string,
    link: string,
    minTime: number,
    maxQuizAttempts: number
    quizTimeLimit: number
    active: boolean
}

// Dummy course data
const rawCourseData: { name: string, description: string, link: string }[] = [
    {
        name: "Dog walker Health & Safety training",
        description: "Learn how to properly walk dogs in a safe and healthy manner",
        link: "https://www.vetvoice.com.au/ec/pet-ownership/the-dog-walkers-safety-guide/",
    },
    {
        name: "Health & Safety Awareness Training",
        description: "Understand workplace hazards present at Queen's",
        link: "https://www.queensu.ca/risk/safety/training/health-safety-awareness"
    },
    {
        name: "Queen's Ergonomics training",
        description: "Learn how to create a comfortable and efficient work environment",
        link: "https://www.queensu.ca/risk/safety/general/ergonomics"
    },
    {
        name: "Queen's asbestos safety training",
        description: "Understand the health risks of asbestos and effective safety measures",
        link: "https://www.queensu.ca/risk/safety/general/asbestos"
    },
    {
        name: "Work placement pre-departure training",
        description: "Learn the risks associated with off-campus work",
        link: "https://www.queensu.ca/risk/safety/general/student-placements"
    },
    {
        name: "West Nile virus information",
        description: "Learn the symptoms and treatments for the West Nile virus",
        link: "https://www.queensu.ca/risk/safety/general/west-nile-virus"
    },
    {
        name: "Dangerous substances",
        description: "Learn Ontario's designated dangerous substances",
        link: "https://www.queensu.ca/risk/designated-substances"
    }
];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const courses: course[] = rawCourseData.map((course) => {
    return {
        ...course,
        minTime: (Math.random() < 0.7 ? randomInt(1, 3) * 15 : randomInt(1, 12) * 60), // 15/30/45 min or 1-12 hours
        maxQuizAttempts: randomInt(1, 10),
        quizTimeLimit: Math.random() < 0.8 ? randomInt(1, 3) * 15 : randomInt(1, 4),
        active: Math.random() < 0.9,
    };
});

const generateDummyData = async () => {

    // First, clean the database data (leaves users & emails) so the new data can be added without conflicts
    const functions = getFunctions();
    await httpsCallable(functions, 'cleanDatabase')()
        .then(() => console.log("Successfully cleaned database data"))
        .catch((error) => { throw new Error(`Error cleaning database data: ${error}`); });

    // Add all the courses
    return Promise.all(courses.map((course) =>
        httpsCallable(functions, 'addCourse')(course)
            .then((id) => {
                if (typeof id.data !== 'string') {
                    throw new Error(`Error: saveCourse should return a course ID string. Returned value: ${id}`);
                }
            })
            .catch((error) => { throw new Error(`Error adding course (name: ${course.name}): ${error}`); })
    ));
}

export { generateDummyData };
