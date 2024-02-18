import { dummyLearnerAccount, dummyAdminAccount } from "../../helpers/testData";
import { expect } from "chai";
import { callOnCallFunction } from "../../helpers/helpers";

suite("Reset password", () => {
    suite('Success cases', () => {

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

    suite('Failure cases', () => {

        let testNumber: number = 0;
        let testData: any;

        const runTest = (description: string, errMsg: string) => {
            ++testNumber;
            const inputCopy = testData; // Original may be updated by later test case before running

            return (
                test(`#${testNumber}: ${description}`, () =>
                    callOnCallFunction("resetPassword", inputCopy)
                        .then(() => { throw new Error("API call should fail"); })
                        .catch((err: any) => {
                            expect(err.message).to.equal(errMsg);
                        })
                )
            );
        }

        testData = {
            email: "functions_ut_resetPassword_invalid_email@gmail.com",
        };
        runTest("Non-existent email", "Email does not exist or an error occurred");

        testData = {
            email: null,
        };
        runTest("Invalid email #1", "ValidationError: email is a required field");

        testData = {
            email: 12345,
        };
        runTest("Invalid email #2", "ValidationError: email must be a `string` type, but the final value was: `12345`.");

        testData = {
            email: "",
        };
        runTest("Invalid email #3", "ValidationError: email is a required field");

        testData = {
            email: "test.at.test.com",
        };
        runTest("Invalid email #4", "ValidationError: email must be a valid email");

        testData = {
            email: "test@@test.com",
        };
        runTest("Invalid email #5", "ValidationError: email must be a valid email");
    });
});
