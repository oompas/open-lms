import { expect } from "chai";
import { callOnCallFunctionWithAuth } from "../helpers/helpers";
import { dummyAdminAccount, dummyLearnerAccount, addCourse, getCourses } from "../helpers/testData";

suite("Add course", () => {
    suite('Success cases', () => {

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
                    return callOnCallFunctionWithAuth("addCourse", inputCopy, dummyAdminAccount.email, dummyAdminAccount.password)
                        .then((id) => {
                            console.log(`Successfully added new course: ${id.data}`);
                            addCourse(<string>id.data, dummyAdminAccount.email);
                        });
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

        let course: any;
        const runTest = (description: string, expectedError: string) => {
            const inputCopy = course; // Original may be updated by later test case before running
            return (
                test(description, () => {
                    console.log(`Adding course: ${JSON.stringify(inputCopy, null, 4)}\n`);
                    return callOnCallFunctionWithAuth("addCourse", inputCopy, dummyAdminAccount.email, dummyAdminAccount.password)
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

suite("Get courses", () => {
    suite('Success cases', () => {

        let expected: {
            id: string,
            name: string,
            description: string,
            minQuizTime: number,
            status: number,
        }[];

        const runTest = (description: string, admin: boolean) => {
            const email = admin ? dummyAdminAccount.email : dummyLearnerAccount.email;
            const password = admin ? dummyAdminAccount.password : dummyLearnerAccount.password;

            return (
                test(description, () => {
                    console.log(`Getting courses...\n`);
                    return callOnCallFunctionWithAuth("getAvailableCourses", {}, email, password)
                        .then((courses) => {
                            console.log(`Courses: ${JSON.stringify(courses.data, null, 4)}`);
                            expect(courses.data).to.deep.equal(expected);
                        });
                })
            );
        }

        // set expected & run test
    });

    suite('Failure cases', () => {

        let tetData: any;

        const runTest = (description: string, admin: boolean, expectedError: string) => {
            const email = admin ? dummyAdminAccount.email : dummyLearnerAccount.email;
            const password = admin ? dummyAdminAccount.password : dummyLearnerAccount.password;

            return (
                test(description, () => {
                    console.log(`Getting courses...\n`);
                    return callOnCallFunctionWithAuth("getCourses", {}, email, password)
                        .then(() => { throw new Error("Test case should fail") })
                        .catch((err) => { expect(err.message).to.equal(expectedError) });
                })
            );
        }

    });
});

suite("Get course info", () => {

});

suite("Update course", () => {

});

suite("Enroll in course", () => {
    suite('Success cases', () => {

        const courses = getCourses();

        const runTest = (description: string, admin: boolean, courseId: string) => {
            const email = admin ? dummyAdminAccount.email : dummyLearnerAccount.email;
            const password = admin ? dummyAdminAccount.password : dummyLearnerAccount.password;

            return (
                test(description, () => {
                    console.log(`Enrolling in course...\n`);
                    return callOnCallFunctionWithAuth("enrollInCourse", { courseId }, email, password)
                        .then((result) => {
                            console.log(`Enrolled in course: ${result.data}`);
                        });
                })
            );
        }

        for (let i = 0; i < courses.length; i++) {
            runTest(`Course #${i+1} as non-admin`, false, courses[i].courseId);
            runTest(`Course #${i+1} as admin`, true, courses[i].courseId);
        }
    });

    suite('Failure cases', () => {

        let testData: any;

        const runTest = (description: string, admin: boolean, expectedError: string) => {
            const email = admin ? dummyAdminAccount.email : dummyLearnerAccount.email;
            const password = admin ? dummyAdminAccount.password : dummyLearnerAccount.password;

            return (
                test(description, () => {
                    console.log(`Enrolling in course...\n`);
                    return callOnCallFunctionWithAuth("enrollInCourse", testData, email, password)
                        .then(() => { throw new Error("Test case should fail") })
                        .catch((err) => { expect(err.message).to.equal(expectedError) });
                })
            );
        }

        testData = undefined;
        runTest("Invalid course ID", false, "ValidationError: courseId is a required field");
    });
});

suite("Unenroll from course", () => {
    suite('Success cases', () => {

            const courses = getCourses();

            const runTest = (description: string, admin: boolean, courseId: string) => {
                const email = admin ? dummyAdminAccount.email : dummyLearnerAccount.email;
                const password = admin ? dummyAdminAccount.password : dummyLearnerAccount.password;

                return (
                    test(description, () => {
                        console.log(`Unenrolling from course...\n`);
                        return callOnCallFunctionWithAuth("unenrollFromCourse", { courseId }, email, password)
                            .then((result) => {
                                console.log(`Unenrolled from course: ${result.data}`);
                            });
                    })
                );
            }

            for (let i = 0; i < courses.length; i++) {
                runTest(`Course #${i+1} as non-admin`, false, courses[i].courseId);
                runTest(`Course #${i+1} as admin`, true, courses[i].courseId);
            }
    });

    suite('Failure cases', () => {

            let testData: any;

            const runTest = (description: string, admin: boolean, expectedError: string) => {
                const email = admin ? dummyAdminAccount.email : dummyLearnerAccount.email;
                const password = admin ? dummyAdminAccount.password : dummyLearnerAccount.password;

                return (
                    test(description, () => {
                        console.log(`Unenrolling from course...\n`);
                        return callOnCallFunctionWithAuth("unenrollFromCourse", testData, email, password)
                            .then(() => { throw new Error("Test case should fail") })
                            .catch((err) => { expect(err.message).to.equal(expectedError) });
                    })
                );
            }

            testData = undefined;
            runTest("Invalid course ID", false, "ValidationError: courseId is a required field");
    });
});
