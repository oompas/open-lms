import testEnv from "../../index.test";
import { addCourse } from "../../../src";
import { expect } from "chai";
import { DOCUMENT_ID_LENGTH } from "../../helpers/helpers";

interface TestInput {
    testDescription: string,
    name: any,
    description: any,
    link: any,
    minTime: any,
    maxQuizAttempts: any,
    quizTimeLimit: any,
    active: any,
}
let testNumber = 0; // Increment each time

const testAddCourse = (input: TestInput, errorMessage: undefined | string) => {
    ++testNumber;
    const message = errorMessage ? "fail to add course" : "added course successfully";
    const { testDescription: testDescription, ...course } = input;

    return (
        describe(`#${testNumber}: ${testDescription}`, () => {
            it(message, () => {

                const data = testEnv.firestore.makeDocumentSnapshot(course, `TestInput/addCourse#${testNumber}`);

                // Check if the call passes or fails as desired
                if (errorMessage) {
                    try { // @ts-ignore
                        return testEnv.wrap(addCourse)(data)
                            .then(() => { throw new Error("API call should fail"); })
                            .catch((err: any) => expect(err.message).to.equal(errorMessage));
                    } catch (err) { // @ts-ignore
                        expect(err.message).to.equal(errorMessage);
                        return;
                    }
                }

                // @ts-ignore
                return testEnv.wrap(addCourse)(data).then(async (result: string) => {
                    expect(typeof result).to.equal("string");
                    expect(result).to.have.length(DOCUMENT_ID_LENGTH);
                });
            })
        })
    );
}

describe('Success cases for addCourse endpoint...', () => {

    let testData: TestInput;
    const test = () => testAddCourse(testData, undefined);

    testData = {
        testDescription: "Simple active course",
        name: "Unit test",
        description: "Unit test",
        link: "www.unittest.com",
        minTime: 1,
        maxQuizAttempts: 1,
        quizTimeLimit: 1,
        active: true,
    };
    test();

    testData = {
        testDescription: "Simple inactive course",
        name: "Unit test",
        description: "Unit test",
        link: "www.unittest.com",
        minTime: 1,
        maxQuizAttempts: 1,
        quizTimeLimit: 1,
        active: false,
    };
    test();

    /*
    testData = {
        testDescription: "",
        name: "",
        description: "",
        link: "",
        minTime: 1,
        maxQuizAttempts: 1,
        quizTimeLimit: 1,
        active: true,
    };
    test();
     */
});

describe('Failure cases for addCourse endpoint...', () => {

});
