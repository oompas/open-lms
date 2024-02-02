import { expect } from "chai";
import { callOnCallFunctionWithAuth } from "../../helpers/helpers";

describe('Success cases for addCourse endpoint...', () => {

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
    const test = (testDescription: string) => {
        ++testNumber;
        const inputCopy = course; // Original may be updated by later test case before running

        return (
            describe(`#${testNumber}: ${testDescription}`, () => {
                it("added course successfully", () =>
                    callOnCallFunctionWithAuth("addCourse", inputCopy, "18rem8@queensu.ca", "password12345")
                        .then((id) => console.log(`Successfully added new course: ${id.data}`))
                )
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
    test("Simple active course");

    course = {
        name: "Unit test",
        description: "Unit test",
        link: "www.unittest.com",
        minTime: 1,
        maxQuizAttempts: 1,
        quizTimeLimit: 1,
        active: false,
    };
    test("Simple inactive course");
});

describe('Failure cases for addCourse endpoint...', () => {

    let testNumber = 0;
    let course: any;
    const test = (testDescription: string, expectedError: string) => {
        ++testNumber;
        const inputCopy = course; // Original may be updated by later test case before running

        return (
            describe(`#${testNumber}: ${testDescription}`, () => {
                it("added course successfully", () =>
                    callOnCallFunctionWithAuth("addCourse", inputCopy, "18rem8@queensu.ca", "password12345")
                        .then(() => { throw new Error("Test case should fail") })
                        .catch((err) => { expect(err.message).to.equal(expectedError) })
                )
            })
        );
    }

    course = null;
    test("Null course input", "ValidationError: this cannot be null");

    course = undefined;
    test("Undefined course input", "ValidationError: this cannot be null");

    course = "Unit test invalid value";
    test("String course input", "ValidationError: this must be a `object` type, but the final value was: `\"Unit test invalid value\"`.");

    course = 12345;
    test("Number course input", "ValidationError: this must be a `object` type, but the final value was: `12345`.");

    course = [];
    test("Array course input", "ValidationError: this must be a `object` type, but the final value was: `[]`.");

    course = {};
    test("Empty object course input", "ValidationError: active is a required field");
});
