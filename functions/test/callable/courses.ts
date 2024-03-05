import { expect } from "chai";
import { callOnCallFunction, callOnCallFunctionWithAuth } from "../helpers/helpers";
import DataGenerator from "../helpers/dataGenerator";

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

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

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

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

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
        });
    });

    /**
     * Tests for getAvailableCourses endpoint
     */
    suite("Get courses", () => {

        suite('Success cases', () => {

            suiteSetup(() => {
                console.log("===============================");
                console.log("Test case: Get course (success)");
                console.log("===============================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

            let expected: {
                name: string,
                description: string,
                link: string,
                minTime: number,
                maxQuizAttempts: number,
                quizTimeLimit: number,
                status: number,
            }[];

            const runTest = (description: string, admin: boolean) => {
                const user = admin ? DataGenerator.getDummyAdminAccount() : DataGenerator.getDummyLearnerAccount();

                return (
                    test(description, () => {
                        console.log(`Getting courses...\n`);
                        return callOnCallFunctionWithAuth("getAvailableCourses", {}, user)
                            .then((result) => {
                                const courses: { id: string }[] = result.data as { id: string  }[];
                                console.log(`Courses: ${JSON.stringify(courses, null, 4)}`);

                                // @ts-ignore Remove ID field for comparison
                                courses.forEach((c) => delete c.id);
                                expect(courses).to.deep.equal(expected);
                            });
                    })
                );
            }

            expected = [
                {
                    name: "Unit test",
                    description: "Unit test",
                    link: "www.unittest.com",
                    minTime: 1,
                    maxQuizAttempts: 1,
                    quizTimeLimit: 1,
                    status: 1,
                },
                {
                    name: "Unit test",
                    description: "Unit test",
                    link: "www.unittest.com",
                    minTime: 1,
                    maxQuizAttempts: 1,
                    quizTimeLimit: 1,
                    status: 1,
                }
            ];
            runTest("As a learner", false);

            runTest("As an admin", false);
        });

        suite('Failure cases', () => {

            suiteSetup(() => {
                console.log("===============================");
                console.log("Test case: Get course (failure)");
                console.log("===============================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

            test("Unauthenticated", () => {
                console.log(`Getting courses...\n`);
                return callOnCallFunction("getAvailableCourses", {})
                    .then(() => { throw new Error("Test case should fail") })
                    .catch((err) => { expect(err.message).to.equal("You must be logged in to call the API") });
            });

        });
    });

    /**
     * Tests for getCourseInfo endpoint
     */
    suite("Get course info", () => {

    });

    /**
     * Tests for updateCourse endpoint
     */
    suite("Update course", () => {

    });

    /**
     * Tests for courseEnroll endpoint
     */
    suite("Enroll in course", () => {

        suite('Success cases', () => {

            suiteSetup(() => {
                console.log("==================================");
                console.log("Test case: Course enroll (success)");
                console.log("==================================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

            const runTest = (description: string, admin: boolean, courseId: string) => {
                const user = admin ? DataGenerator.getDummyAdminAccount() : DataGenerator.getDummyLearnerAccount();

                return (
                    test(description, () => {
                        console.log(`Enrolling in course...\n`);
                        return callOnCallFunctionWithAuth("courseEnroll", { courseId }, user)
                            .then((result) => {
                                console.log(`Enrolled in course: ${result.data}`);
                            });
                    })
                );
            }

            // for (let i = 0; i < courses.length; i++) {
            //     runTest(`Course #${i+1} as non-admin`, false, courses[i].courseId);
            //     runTest(`Course #${i+1} as admin`, true, courses[i].courseId);
            // }
        });

        suite('Failure cases', () => {

            suiteSetup(() => {
                console.log("==================================");
                console.log("Test case: Course enroll (failure)");
                console.log("==================================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

            let testData: any;

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

            testData = undefined;
            runTest("Invalid course ID", false, "ValidationError: courseId is a required field");
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

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

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

            // for (let i = 0; i < courses.length; i++) {
            //     runTest(`Course #${i+1} as non-admin`, false, courses[i].courseId);
            //     runTest(`Course #${i+1} as admin`, true, courses[i].courseId);
            // }
        });

        suite('Failure cases', () => {

            suiteSetup(() => {
                console.log("====================================");
                console.log("Test case: Course unenroll (failure)");
                console.log("====================================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

            let testData: any;

            const runTest = (description: string, admin: boolean, expectedError: string) => {
                const user = admin ? DataGenerator.getDummyAdminAccount() : DataGenerator.getDummyLearnerAccount();

                return (
                    test(description, () => {
                        console.log(`Unenrolling from course...\n`);
                        return callOnCallFunctionWithAuth("unenrollFromCourse", testData, user)
                            .then(() => { throw new Error("Test case should fail") })
                            .catch((err) => { expect(err.message).to.equal(expectedError) });
                    })
                );
            }

            testData = undefined;
            runTest("Invalid course ID", false, "ValidationError: courseId is a required field");
        });
    });
});
