import { callApi } from "@/config/firebase";

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

const exampleQuestions = [
    {
        question: "What is the capital of Canada?",
        type: "mc",
        answers: ["Ottawa", "Toronto", "Montreal", "Vancouver"],
        correctAnswer: 0,
    },
    {
        question: "Is the sky blue?",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "What is the largest city in Canada by population?",
        type: "mc",
        answers: ["Ottawa", "Toronto", "Montreal", "Vancouver"],
        correctAnswer: 1,
    },
    {
        question: "What is the largest province in Canada by area?",
        type: "mc",
        answers: ["Ontario", "Quebec", "British Columbia", "Alberta"],
        correctAnswer: 1,
    },
    {
        question: "What is the smallest province in Canada by area?",
        type: "mc",
        answers: ["Ontario", "Quebec", "British Columbia", "Prince Edward Island"],
        correctAnswer: 3,
    },
    {
        question: "What is the smallest territory in Canada by area?",
        type: "mc",
        answers: ["Yukon", "Northwest Territories", "Nunavut"],
        correctAnswer: 0,
    },
    {
        question: "What is the largest territory in Canada by area?",
        type: "mc",
        answers: ["Yukon", "Northwest Territories", "Nunavut"],
        correctAnswer: 2,
    },
    {
        question: "Which Canadian province or territory is the most beautiful? Why?",
        type: "sa",
    },
    {
        question: "Canadian confederation was in 1867",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "What is the national animal of Canada?",
        type: "mc",
        answers: ["Beaver", "Moose", "Polar Bear", "Loon"],
        correctAnswer: 0,
    },
    {
        question: "What sets Canada apart from the United states culturally?",
        type: "sa",
    },
    {
        question: "What person, place or thing best exemplifies Canadian culture best in your opinion and why?",
        type: "sa",
    },
    {
        question: "What is the national summer sport of Canada?",
        type: "mc",
        answers: ["Hockey", "Lacrosse", "Soccer", "Baseball"],
        correctAnswer: 1,
    },
    {
        question: "What is the national winter sport of Canada?",
        type: "mc",
        answers: ["Hockey", "Lacrosse", "Soccer", "Baseball"],
        correctAnswer: 0,
    },
    {
        question: "The capital of Ontario is Toronto",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "The capital of Quebec is Montreal",
        type: "tf",
        correctAnswer: 1,
    },
    {
        question: "The capital of British Columbia is Vancouver",
        type: "tf",
        correctAnswer: 1,
    },
    {
        question: "The capital of Alberta is Calgary",
        type: "tf",
        correctAnswer: 1,
    },
    {
        question: "The capital of Saskatchewan is Regina",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "The capital of Manitoba is Winnipeg",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "The capital of Nova Scotia is Halifax",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "The capital of New Brunswick is Fredericton",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "The capital of Prince Edward Island is Charlottetown",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "The capital of Newfoundland and Labrador is St. John's",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "The capital of Yukon is Whitehorse",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "The capital of Northwest Territories is Yellowknife",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "The capital of Nunavut is Iqaluit",
        type: "tf",
        correctAnswer: 0,
    },
    {
        question: "The capital of Canada is Toronto",
        type: "tf",
        correctAnswer: 1,
    },
    {
        question: "The capital of Canada is Montreal",
        type: "tf",
        correctAnswer: 1,
    },
    {
        question: "The capital of Canada is Vancouver",
        type: "tf",
        correctAnswer: 1,
    },
    {
        question: "The capital of Canada is Calgary",
        type: "tf",
        correctAnswer: 1,
    },
    {
        question: "The capital of Canada is Regina",
        type: "tf",
        correctAnswer: 1,
    },
    {
        question: "The capital of Canada is Winnipeg",
        type: "tf",
        correctAnswer: 1,
    },
    {
        question: "The capital of Canada is Halifax",
        type: "tf",
        correctAnswer: 1,
    },
    {
        question: "The capital of Canada is Fredericton",
        type: "tf",
        correctAnswer: 1,
    },
    {
        question: "The capital of Canada is Charlottetown",
        type: "tf",
        correctAnswer: 1,
    }
]

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChance = (chance: number) => Math.random() < chance;

const courses = rawCourseData.map((course) => {

    // @ts-ignore
    course["minTime"] = null; // @ts-ignore
    course["quiz"] = null;
    if (randomChance(0.7)) { // @ts-ignore
        course["minTime"] = Math.random() < 0.7 ? randomInt(1, 3) * 15 : randomInt(1, 12) * 60;
    } // @ts-ignore
    if (!course["minTime"] || randomChance(0.6)) {
        // @ts-ignore
        course["quizQuestions"] = exampleQuestions.sort(() => Math.random() - 0.5).slice(0, randomInt(2, 6)).map((question) => {
            const marks = question.type === "sa" ? randomInt(2, 5) : randomInt(1, 2);
            return { ...question, marks: marks };
        });

        // @ts-ignore
        course["quiz"] = { // @ts-ignore
            minScore: randomInt(1, course["quizQuestions"].reduce((a, b) => a + b.marks, 0)),
            maxAttempts: randomChance(0.5) ? randomInt(1, 10) : null,
            timeLimit: randomChance(0.5) ? (randomChance(0.7) ? randomInt(1, 3) * 15 : randomInt(1, 4)) : null,
            preserveOrder: randomChance(0.5)
        };
    }

    return course;
});

const generateDummyData = async () => {

    // First, clean the database data (leaves users & emails) so the new data can be added without conflicts
    await callApi('cleanDatabase', {})
        .then(() => console.log("Successfully cleaned database data"))
        .catch((error) => { throw new Error(`Error cleaning database data: ${error}`); });

    // Add all the courses
    const courseIds: string[] = [];
    await Promise.all(courses.map(async (course) => {
        return callApi('addCourse', course)
            .then((id) => {
                if (typeof id.data !== 'string') {
                    throw new Error(`Error: saveCourse should return a course ID string. Returned value: ${id}`);
                }
                courseIds.push(id.data);
            })
            .catch((error) => { throw new Error(`Error adding course (name: ${course.name}): ${error}`); });
    }));

    const promises: Promise<any>[] = [];

    courseIds.forEach((id) => {
        promises.push(
            callApi('setCourseVisibility', { courseId: id, active: true })
                .then(() => console.log(`Successfully published course ${id}`))
                .catch((error) => { throw new Error(`Error publishing course ${id}: ${error}`); })
        );
    });

    return Promise.all(promises)
        .then(() => console.log("Successfully adding all quiz questions and publishing all courses"))
        .catch((error) => { throw new Error(`Error adding all quiz questions and publishing all courses: ${error}`); });
}

export { generateDummyData };
