import { dummyLearnerAccount, dummyAdminAccount } from "../../helpers/testData";
import { expect } from "chai";
import { callOnCallFunction } from "../../helpers/helpers";

suite('Success cases for resetPassword endpoint...', () => {

    interface TestInput {
        description: string,
        email: any,
    }

    let testNumber: number = 0;
    let testData: TestInput;
    const runTest = () => {
        ++testNumber;
        const inputCopy = testData; // Original may be updated by later test case before running

        return (
            test(`#${testNumber}: ${inputCopy.description}`, () =>
                callOnCallFunction("resetPassword", inputCopy)
                    .then((result) => {
                        expect(result.data).to.equal(`Password reset email created for ${inputCopy.email}`);
                    })
            )
        );
    }

    testData = {
        description: "Dummy learner email",
        email: dummyLearnerAccount.email,
    };
    runTest();

    testData = {
        description: "Dummy admin email",
        email: dummyAdminAccount.email,
    }
    runTest();
});

suite('Failure cases for resetPassword endpoint...', () => {

    interface TestInput {
        description: string,
        email: any,
    }

    let testNumber: number = 0;
    let testData: TestInput;

    const runTest = (errMsg: string, errCode: string) => {
        ++testNumber;
        const inputCopy = testData; // Original may be updated by later test case before running

        return (
            test(`#${testNumber}: ${inputCopy.description}`, () =>
                callOnCallFunction("resetPassword", inputCopy)
                    .then(() => { throw new Error("API call should fail"); })
                    .catch((err: any) => {
                        expect(err.code).to.equal(errCode);
                        expect(err.message).to.equal(errMsg);
                    })
            )
        );
    }

    testData = {
        description: "Non-existent email",
        email: "functions_ut_resetPassword_invalid_email@gmail.com",
    };
    runTest("Email does not exist or an error occurred", "functions/invalid-argument");

    testData = {
        description: "Invalid email #1",
        email: null,
    };
    runTest("ValidationError: email is a required field", "functions/invalid-argument");

    testData = {
        description: "Invalid email #2",
        email: 12345,
    };
    runTest("ValidationError: email must be a `string` type, but the final value was: `12345`.", "functions/invalid-argument");

    testData = {
        description: "Invalid email #3",
        email: "",
    };
    runTest("ValidationError: email is a required field", "functions/invalid-argument");

    testData = {
        description: "Invalid email #4",
        email: "test.at.test.com",
    };
    runTest("ValidationError: email must be a valid email", "functions/invalid-argument");

    testData = {
        description: "Invalid email #5",
        email: "test@@test.com",
    };
    runTest("ValidationError: email must be a valid email", "functions/invalid-argument");
});
