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
        description: "Learn how to properly walk dogs in a safe and healthy way",
        link: "https://www.vetvoice.com.au/ec/pet-ownership/the-dog-walkers-safety-guide/",
    }
];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const courses: course[] = rawCourseData.map((course) => {
    return {
        ...course,
        minTime: Math.random() < 0.5 ? randomInt(1, 3) * 15 : randomInt(1, 24) * 60,
        maxQuizAttempts: randomInt(1, 10),
        quizTimeLimit: Math.random() < 0.8 ? randomInt(1, 3) * 15 : randomInt(1, 4) * 60,
        active: Math.random() < 0.9,
    };
});

const generateCourses = async () => {

    // First, clean the database data (leaves users & emails) so the new data can be added without conflicts
    const functions = getFunctions();
    await httpsCallable(functions, 'cleanDatabase')()
        .then(() => console.log("Successfully cleaned database data"))
        .catch((error) => { throw new Error(`Error cleaning database data: ${error}`); });

    // Add all the courses
    return Promise.all(courses.map((course) =>
        httpsCallable(functions, 'saveCourse')(course)
            .then((id) => {
                if (typeof id.data !== 'string') {
                    throw new Error(`Error: saveCourse should return a course ID string. Returned value: ${id}`);
                }
            })
            .catch((error) => { throw new Error(`Error adding course (name: ${course.name}): ${error}`); })
    ));
}

export { generateCourses };
