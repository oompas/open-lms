import { dummyLearnerAccount, dummyAdminAccount } from "../../helpers/testData";
import { expect } from "chai";
import { callOnCallFunction } from "../../helpers/helpers";

suite("Reset password", () => {
    suite('Success cases', () => {

        let testData: { email: string };
        const runTest = (description: string) => {
            const inputCopy = testData; // Original may be updated by later test case before running
            return (
                test(description, () => {
                    console.log(`Resetting password for ${inputCopy.email}`);
                    return callOnCallFunction("resetPassword", inputCopy)
                        .then((result) => {
                            expect(result.data).to.equal(`Password reset email created for ${inputCopy.email}`);
                        });
                })
            );
        }

        testData = { email: dummyLearnerAccount.email };
        runTest("Dummy learner email");

        testData = { email: dummyAdminAccount.email };
        runTest("Dummy admin email");
    });

    suite('Failure cases', () => {

        let testData: any;
        const runTest = (description: string, errMsg: string) => {
            const inputCopy = testData; // Original may be updated by later test case before running
            return (
                test(description, () => {
                    if (inputCopy.email) {
                        console.log(`Resetting password for ${inputCopy.email}`);
                    } else {
                        console.log(`Resetting password for invalid input format`);
                    }

                    return callOnCallFunction("resetPassword", inputCopy)
                        .then(() => { throw new Error("API call should fail"); })
                        .catch((err: any) => {
                            expect(err.message).to.equal(errMsg);
                        });
                })
            );
        }

        suite("Invalid email format", () => {
            const emails: any[] = [undefined, null, "", 12345, 10.5];
            for (const email of emails) {
                testData = {
                    email: email,
                };
                const errMsg = !email
                    ? "ValidationError: email is a required field"
                    : "ValidationError: email must be a `string` type, but the final value was: `" + email + "`.";

                runTest(String(email), errMsg);
            }
        });

        suite("Invalid emails", () => {
            const emails: string[] = ["test.at.test.com", "test@@test.com", "open LMS@gmail.com"];
            for (const email of emails) {
                testData = {
                    email: email,
                };
                runTest(email, "ValidationError: email must be a valid email");
            }
        });

        testData = {
            email: "functions_ut_resetPassword_invalid_email@gmail.com",
        };
        runTest("Non-existent email", "Email does not exist or an error occurred");
    });
});
