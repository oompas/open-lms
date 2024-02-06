import { dummyLearnerAccount, dummyAdminAccount } from "../../helpers/setupDummyData";
import testEnv from "../../index.test";
import { resetPassword } from "../../../src";
import { assert, expect } from "chai";
import { callOnCallFunction } from "../../helpers/helpers";

describe('Success cases for resetPassword endpoint...', () => {

    interface TestInput {
        description: string,
        email: any,
    }

    let testNumber: number = 0;
    let testData: TestInput;
    const test = () => {
        ++testNumber;
        //const message = errorMessage ? "fail to reset password" : "reset password successfully";
        const inputCopy = testData; // Original may be updated by later test case before running

        // // Check if the call passes or fails as desired
        // if (errorMessage) {
        //     try { // @ts-ignore
        //         return testEnv.wrap(resetPassword)(data)
        //             .then(() => { throw new Error("API call should fail"); })
        //             .catch((err: any) => assert.equal(err.message, errorMessage));
        //     } catch (err) { // @ts-ignore
        //         assert.equal(err.message, errorMessage);
        //         return;
        //     }
        // }

        return (
            describe(`#${testNumber}: ` + inputCopy.description, () => {
                it("reset password successfully", () =>
                    callOnCallFunction("resetPassword", inputCopy)
                        .then((result) => {
                            expect(result.data).to.equal(`Password reset email created for ${inputCopy.email}`);
                        })
                    // // @ts-ignore
                    // return testEnv.wrap(resetPassword)(data).then(async (result: string) => {
                    //     assert.equal(result, `Password reset email created for ${input.email}`,
                    //         "Response message does not match expected");
                    // });
                )
            })
        );
    }

    testData = {
        description: "Dummy learner email",
        email: dummyLearnerAccount.email,
    };
    test();

    testData = {
        description: "Dummy admin email",
        email: dummyAdminAccount.email,
    }
    test();
});

describe('Failure cases for resetPassword endpoint...', () => {

    interface TestInput {
        description: string,
        email: any,
    }

    let testNumber: number = 0;
    let testData: TestInput;

    const test = (errMsg: string, errCode: string) => {
        ++testNumber;
        const inputCopy = testData; // Original may be updated by later test case before running

        return (
            describe(`#${testNumber}: ` + inputCopy.description, () => {
                it("fail to reset password", () =>
                    callOnCallFunction("resetPassword", inputCopy)
                        .then(() => { throw new Error("API call should fail"); })
                        .catch((err: any) => {
                            expect(err.code).to.equal(errCode);
                            expect(err.message).to.equal(errMsg);
                        })
                )
            })
        );
    }

    testData = {
        description: "Non-existent email",
        email: "functions_ut_resetPassword_invalid_email@gmail.com",
    };
    test("Email does not exist or an error occurred", "functions/invalid-argument");

    testData = {
        description: "Invalid email #1",
        email: null,
    };
    test("ValidationError: email is a required field", "functions/invalid-argument");

    testData = {
        description: "Invalid email #2",
        email: 12345,
    };
    test("ValidationError: email must be a `string` type, but the final value was: `12345`.", "functions/invalid-argument");

    testData = {
        description: "Invalid email #3",
        email: "",
    };
    test("ValidationError: email is a required field", "functions/invalid-argument");

    testData = {
        description: "Invalid email #4",
        email: "test.at.test.com",
    };
    test("ValidationError: email must be a valid email", "functions/invalid-argument");

    testData = {
        description: "Invalid email #5",
        email: "test@@test.com",
    };
    test("ValidationError: email must be a valid email", "functions/invalid-argument");
});
