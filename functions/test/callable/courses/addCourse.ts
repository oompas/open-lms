import { expect } from "chai";
import { callOnCallFunctionWithAuth } from "../../helpers/helpers";
import { dummyAdminAccount } from "../../helpers/testData";

suite("Add course", () => {
    suite('Success cases', () => {

        interface TestInput {
            name: any,
            description: any,
            link: any,
            minTime: any,
            maxQuizAttempts: any,
            quizTimeLimit: any,
            active: any,
        }

        let testNumber = 0;
        let course: TestInput;
        const runTest = (testDescription: string) => {
            ++testNumber;
            const inputCopy = course; // Original may be updated by later test case before running

            return (
                test(`#${testNumber}: ${testDescription}`, () =>
                    callOnCallFunctionWithAuth("addCourse", inputCopy, dummyAdminAccount.email, dummyAdminAccount.password)
                        .then((id) => console.log(`Successfully added new course: ${id.data}`))
                )
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

        let testNumber = 0;
        let course: any;
        const runTest = (testDescription: string, expectedError: string) => {
            ++testNumber;
            const inputCopy = course; // Original may be updated by later test case before running

            return (
                test(`#${testNumber}: ${testDescription}`, () =>
                    callOnCallFunctionWithAuth("addCourse", inputCopy, dummyAdminAccount.email, dummyAdminAccount.password)
                        .then(() => { throw new Error("Test case should fail") })
                        .catch((err) => { expect(err.message).to.equal(expectedError) })
                )
            );
        }

        course = null;
        runTest("Null course input", "ValidationError: this cannot be null");

        course = undefined;
        runTest("Undefined course input", "ValidationError: this cannot be null");

        course = "Unit test invalid value";
        runTest("String course input", "ValidationError: this must be a `object` type, but the final value was: `\"Unit test invalid value\"`.");

        course = 12345;
        runTest("Number course input", "ValidationError: this must be a `object` type, but the final value was: `12345`.");

        course = [];
        runTest("Array course input", "ValidationError: this must be a `object` type, but the final value was: `[]`.");

        course = {};
        runTest("Empty object course input", "ValidationError: active is a required field");
    });
});
