import { expect } from "chai";
import { callOnCallFunction, callOnCallFunctionWithAuth } from "../helpers/helpers";
import DataGenerator from "../helpers/dataGenerator";
import DummyCourses from "../helpers/dummyData/courses.json";

suite("Course endpoints", () => {

    /**
     * Tests for addCourse endpoint
     */
    suite("Add course", () => {

        suite('Success cases', () => {

            suiteSetup(() => {
                console.log("===============================");
                console.log("Test case: Add course (success)");
                console.log("===============================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(() => DataGenerator.cleanTestData());

            interface TestInput {
                name: string,
                description: string,
                link: string,
                minTime: number,
                maxQuizAttempts: number,
                quizTimeLimit: number,
                active: boolean,
            }

            let course: TestInput;
            const runTest = (description: string) => {
                const inputCopy = course; // Original may be updated by later test case before running
                return (
                    test(description, function() {
                        this.timeout(7_000);

                        console.log(`Adding course: ${JSON.stringify(inputCopy, null, 4)}\n`);
                        return callOnCallFunctionWithAuth("addCourse", inputCopy, DataGenerator.getDummyAdminAccount())
                            .then((id) => console.log(`Successfully added new course: ${id.data}`) );
                    })
                );
            }

            course = {
                name: "Unit test",
                description: "Unit test",
                link: "www.unittest.com",
                minTime: 1,
                maxQuizAttempts: 1,
                quizTimeLimit: 1,
                active: true,
            };
            runTest("Simple active course");

            course = {
                name: "Unit test",
                description: "Unit test",
                link: "www.unittest.com",
                minTime: 1,
                maxQuizAttempts: 1,
                quizTimeLimit: 1,
                active: false,
            };
            runTest("Simple inactive course");
        });

        suite('Failure cases', () => {

            suiteSetup(() => {
                console.log("===============================");
                console.log("Test case: Add course (failure)");
                console.log("===============================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(() => DataGenerator.cleanTestData());

            let course: any;
            const runTest = (description: string, expectedError: string) => {
                const inputCopy = course; // Original may be updated by later test case before running
                return (
                    test(description, () => {
                        console.log(`Adding course: ${JSON.stringify(inputCopy, null, 4)}\n`);
                        return callOnCallFunctionWithAuth("addCourse", inputCopy, DataGenerator.getDummyAdminAccount())
                            .then(() => { throw new Error("Test case should fail") })
                            .catch((err) => { expect(err.message).to.equal(expectedError) });
                    })
                );
            }

            suite("Invalid course structure", () => {
                const courses = [undefined, null, "", 12345, 10.5, "unit test", []];
                for (const course of courses) {
                    runTest(String(course), "ValidationError: this cannot be null");
                }
            });

            course = {};
            runTest("Empty object course input", "ValidationError: active is a required field");

            course = {
                name: "Course name that happens to be longer than 50 characters",
                description: "Unit test",
                link: "www.unittest.com",
                minTime: 1,
                maxQuizAttempts: 1,
                quizTimeLimit: 1,
                active: false,
            };
            runTest("Name too long", "ValidationError: Name can't be over 50 characters long");

            course = {
                name: "Unit test",
                description: "Unit test",
                link: "www.unittest.com",
                minTime: -1,
                maxQuizAttempts: -1,
                quizTimeLimit: -1,
                active: false,
            };
            runTest("Negative course input", "ValidationError: quizTimeLimit must be a positive number");

            course = {
                name: 5,
                description: 10,
                link: 4,
                minTime: "Unit test",
                maxQuizAttempts: "Unit test",
                quizTimeLimit: "Unit test",
                active: "Unit test",
            };
            runTest("Incorrect types", "ValidationError: active must be a `boolean` type, but the final value was: `\"Unit test\"`.");
        });
    });

    /**
     * Tests for getAvailableCourses endpoint
     */
    suite("Get courses", () => {

        suite('Success cases', () => {

            suiteSetup(async () => {
                console.log("===============================");
                console.log("Test case: Get course (success)");
                console.log("===============================");

                await DataGenerator.generateDummyAccounts();

                return DataGenerator.generateDummyCourses();
            });

            suiteTeardown(() => DataGenerator.cleanTestData());

            let expected: {
                name: string,
                description: string,
                link: string,
                minTime: number,
                quizTimeLimit: number,
                maxQuizAttempts: number,
                status: number,
            }[];

            const runTest = (description: string, admin: boolean) => {
                const user = admin ? DataGenerator.getDummyAdminAccount() : DataGenerator.getDummyLearnerAccount();

                return (
                    test(description, () => {
                        console.log(`Getting courses...\n`);
                        return callOnCallFunctionWithAuth("getAvailableCourses", {}, user)
                            .then((res) => {
                                const courses: { id: string }[] = res.data as { id: string  }[];
                                console.log(`Courses: ${JSON.stringify(courses, null, 4)}`);

                                // @ts-ignore Remove ID field for comparison
                                courses.forEach((c) => delete c.id);
                                // @ts-ignore
                                const result = courses.sort((c1, c2) => ('' + c1.name).localeCompare(c2.name));
                                const expectedResult = expected.sort((c1, c2) => ('' + c1.name).localeCompare(c2.name));

                                expect(result).to.deep.equal(expectedResult);
                            });
                    })
                );
            }

            expected = DummyCourses
                .filter(c => c.active)
                .map((course) => {
                    const { active, ...data } = course;
                    return { ...data, status: 1 };
                });
            runTest("As a learner", false);
            runTest("As an admin", true);
        });

        suite('Failure cases', () => {

            suiteSetup(() => {
                console.log("===============================");
                console.log("Test case: Get course (failure)");
                console.log("===============================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(() => DataGenerator.cleanTestData());
            const runTest = (description: string, admin: boolean, expectedError: string) => {
                return (
                    test("Unauthenticated", () => {
                        console.log(`Getting courses...\n`);
                        return callOnCallFunction("getAvailableCourses", {})
                            .then(() => { throw new Error("Test case failed") })
                            .catch((err) => { expect(err.message).to.equal("Test case failed") });
                    })
                );
            }
            runTest("Unauthenticated user", false, "Test case failed");
        });
    });

    /**
     * Tests for getCourseInfo endpoint
     */
    suite("Get course info", () => {

        suite('Success cases', () => {

            suiteSetup(async () => {
                console.log("====================================");
                console.log("Test case: Get course info (success)");
                console.log("====================================");

                await DataGenerator.generateDummyAccounts();
                await DataGenerator.generateDummyCourses();
            });

            suiteTeardown(() => DataGenerator.cleanTestData());

            const runTest = (description: string, admin: boolean, name: string) => {
                const user = admin ? DataGenerator.getDummyAdminAccount() : DataGenerator.getDummyLearnerAccount();
                const DummyCourses = DataGenerator.getDummyCourseData();
                let courseId : string;
                return (
                    test(description, () => {
                        for (const course of DummyCourses) {
                            if (course.name === name) {
                                courseId = course.id;
                            }
                        }
                        console.log(`Getting course info for courseId ${courseId}...\n`);
                        return callOnCallFunctionWithAuth("getCourseInfo", { courseId }, user)
                            .then((res) => {
                                // @ts-ignore
                                expect(res.data.name).to.deep.equal(name);
                            });
                    })
                );
            }

            let expected = DummyCourses
                .filter(c => c.active)
                .map((course) => {
                    const { active, ...data } = course;
                    return { ...data, status: 1 };
                });

            DummyCourses.forEach(course => {
                runTest(`Info for course ${course.name}, non admin`, false, course.name);
                runTest(`Info for course ${course.name}, admin`, true, course.name);
            });
        });

        suite('Failure cases', () => {

            suiteSetup(() => {
                console.log("====================================");
                console.log("Test case: Get course info (failure)");
                console.log("====================================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(() => DataGenerator.cleanTestData());
            const runTest = (description: string, admin: boolean, expectedError: string) => {
                const user = admin ? DataGenerator.getDummyAdminAccount() : DataGenerator.getDummyLearnerAccount();

                return (
                    test("No Course ID", () => {
                        console.log(`Getting course info...\n`);
                        return callOnCallFunctionWithAuth("getCourseInfo", {}, user)
                            .then(() => { throw new Error("Test case should fail") })
                            .catch((err) => { expect(err.message).to.equal("Must provide a course ID to get course info") });
                    })
                );
            }
            runTest(`No course ID provided, non admin`, false, "Must provide a course ID to get course info");
            runTest(`No course ID provided, admin`, true, "Must provide a course ID to get course info");
        });
    });

    /**
     * Tests for courseEnroll endpoint
     */
    suite("Enroll in course", () => {

        suite('Success cases', () => {

            suiteSetup(async () => {
                console.log("==================================");
                console.log("Test case: Course enroll (success)");
                console.log("==================================");

                await DataGenerator.generateDummyAccounts();
                await DataGenerator.generateDummyCourses();
            });

            suiteTeardown(() => DataGenerator.cleanTestData());

            const runTest = (description: string, admin: boolean, name: string) => {
                const user = admin ? DataGenerator.getDummyAdminAccount() : DataGenerator.getDummyLearnerAccount();
                const DummyCourses = DataGenerator.getDummyCourseData();
                let courseId : string;
                return (
                    test(description, () => {
                        for (const course of DummyCourses) {
                            if (course.name === name) {
                                courseId = course.id;
                            }
                        }
                        console.log(`Enrolling in course ${courseId}...\n`);
                        return callOnCallFunctionWithAuth("courseEnroll", { courseId }, user)
                            .then((result) => {
                                console.log(`Enrolled in course: ${result.data}`);
                            });
                    })
                );
            }

            let expected = DummyCourses
                .filter(c => c.active)
                .map((course) => {
                    const { active, ...data } = course;
                    return { ...data, status: 1 };
                });

            // Run tests for each course
            DummyCourses.forEach(course => {
                runTest(`Enroll in course ${course.name}, non admin`, false, course.name);
                runTest(`Enroll in course ${course.name}, admin`, true, course.name);
            });
        });

        suite('Failure cases', () => {

            suiteSetup(() => {
                console.log("==================================");
                console.log("Test case: Course enroll (failure)");
                console.log("==================================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(() => DataGenerator.cleanTestData());

            let testData: any = "Test";

            const runTest = (description: string, admin: boolean, expectedError: string) => {
                const user = admin ? DataGenerator.getDummyAdminAccount() : DataGenerator.getDummyLearnerAccount();

                return (
                    test(description, () => {
                        console.log(`Enrolling in course...\n`);
                        return callOnCallFunctionWithAuth("courseEnroll", testData, user)
                            .then(() => { throw new Error("Test case should fail") })
                            .catch((err) => { expect(err.message).to.equal(expectedError) });
                    })
                );
            }

            runTest("Invalid course ID, non admin", false, "Must provide a course ID to enroll in");
            runTest("Invalid course ID, admin", true, "Must provide a course ID to enroll in");
        });
    });

    /**
     * Tests for courseUnenroll endpoint
     */
    suite("Unenroll from course", () => {

        suite('Success cases', () => {

            suiteSetup(() => {
                console.log("====================================");
                console.log("Test case: Course unenroll (success)");
                console.log("====================================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(() => DataGenerator.cleanTestData());

            const runTest = (description: string, admin: boolean, courseId: string) => {
                const user = admin ? DataGenerator.getDummyAdminAccount() : DataGenerator.getDummyLearnerAccount();

                return (
                    test(description, () => {
                        console.log(`Unenrolling from course...\n`);
                        return callOnCallFunctionWithAuth("courseUnenroll", { courseId }, user)
                            .then((result) => {
                                console.log(`Unenrolled from course: ${result.data}`);
                            });
                    })
                );
            }

            let expected = DummyCourses
                .filter(c => c.active)
                .map((course) => {
                    const { active, ...data } = course;
                    return { ...data, status: 1 };
                });

            DummyCourses.forEach(course => {
                runTest(`Unenroll from course ${course.name}, non admin`, false, course.name);
                runTest(`Unenroll from course ${course.name}, admin`, true, course.name);
            });
        });

        suite('Failure cases', () => {

            suiteSetup(() => {
                console.log("====================================");
                console.log("Test case: Course unenroll (failure)");
                console.log("====================================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(() => DataGenerator.cleanTestData());

            let testData: any = "Test";

            const runTest = (description: string, admin: boolean, expectedError: string) => {
                const user = admin ? DataGenerator.getDummyAdminAccount() : DataGenerator.getDummyLearnerAccount();

                return (
                    test(description, () => {
                        console.log(`Unenrolling from course...\n`);
                        return callOnCallFunctionWithAuth("courseUnenroll", testData, user)
                            .then(() => { throw new Error("Test case should fail") })
                            .catch((err) => { expect(err.message).to.equal(expectedError) });
                    })
                );
            }

            runTest("Invalid course ID, non admin", false, "Must provide a course ID to unenroll from");
            runTest("Invalid course ID, admin", true, "Must provide a course ID to unenroll from");
        });
    });
});
