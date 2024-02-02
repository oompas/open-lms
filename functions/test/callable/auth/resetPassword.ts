import { dummyLearnerAccount, dummyAdminAccount } from "../../helpers/setupDummyData";
import testEnv from "../../index.test";
import { resetPassword } from "../../../src";
import { assert } from "chai";

interface TestInput {
    description: string,
    email: any,
}
let testNumber = 0; // Increment each time

const testResetPassword = (input: TestInput, errorMessage: undefined | string) => {
    ++testNumber;
    const message = errorMessage ? "fail to reset password" : "reset password successfully";

    return (
        describe(`#${testNumber}: ` + input.description, () => {
            it(message, () => {

                const data = testEnv.firestore.makeDocumentSnapshot({
                    email: input.email,
                }, `TestInput/resetPassword#${testNumber}`);

                // Check if the call passes or fails as desired
                if (errorMessage) {
                    try { // @ts-ignore
                        return testEnv.wrap(resetPassword)(data)
                            .then(() => { throw new Error("API call should fail"); })
                            .catch((err: any) => assert.equal(err.message, errorMessage));
                    } catch (err) { // @ts-ignore
                        assert.equal(err.message, errorMessage);
                        return;
                    }
                }

                // @ts-ignore
                return testEnv.wrap(resetPassword)(data).then(async (result: string) => {
                    assert.equal(result, `Password reset email created for ${input.email}`,
                        "Response message does not match expected");
                });
            })
        })
    );
}

describe('Success cases for resetPassword endpoint...', () => {

    let testData: TestInput;

    const test = () => testResetPassword(testData, undefined);

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

    testNumber = 0;
    let testData: TestInput;

    const test = (errMsg: string) => testResetPassword(testData, errMsg);

    testData = {
        description: "Non-existent email",
        email: "functions_ut_resetPassword_invalid_email@gmail.com",
    };
    test("Email does not exist or an error occurred");

    testData = {
        description: "Invalid email #1",
        email: null,
    };
    test("The parameter email is required");

    testData = {
        description: "Invalid email #2",
        email: 12345,
    };
    test("The parameter email is required");

    testData = {
        description: "Invalid email #3",
        email: "",
    };
    test("The parameter email is required");

    testData = {
        description: "Invalid email #4",
        email: "test.at.test.com",
    };
    test("Email does not exist or an error occurred");

    testData = {
        description: "Invalid email #5",
        email: "test@@test.com",
    };
    test("Email does not exist or an error occurred");
});
