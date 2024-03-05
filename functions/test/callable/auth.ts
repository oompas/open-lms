import { expect } from "chai";
import { callOnCallFunction, randomInt, USER_ID_LENGTH } from "../helpers/helpers";
import { HttpsError } from "firebase-functions/v2/https";
import { faker } from "@faker-js/faker";
import DataGenerator from "../helpers/dataGenerator";

suite("Auth endpoints", () => {

    /**
     * Tests for createAccount endpoint
     */
    suite("Create account", () => {

        const randomPassword = () => faker.internet.password({ length: randomInt(6, 200), memorable: Math.random() < 0.3 });

        suite('Success cases', () => {

            suiteSetup(() => {
                console.log("===================================");
                console.log("Test case: Create account (success)");
                console.log("===================================");

                console.log("No setup required for this suite");
            });

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

            let testData: { email: string, password: string };
            const runTest = (description: string) => {
                const inputCopy = testData; // Original may be updated by later test case before running
                return (
                    test(description, () => {
                        console.log(`Creating account for ${inputCopy.email} with password ${inputCopy.password}`);
                        return callOnCallFunction("createAccount", inputCopy)
                            .then((result) => {
                                    expect(result.data).to.be.a('string');
                                    expect(result.data).to.match(new RegExp(`^[a-zA-Z0-9]{${USER_ID_LENGTH}}$`));

                                    console.log(`Successfully successfully user ${inputCopy.email}`);
                                }
                            );
                    })
                );
            }

            suite("Random inputs", () => {
                for (let i = 1; i <= 10; ++i) {
                    testData = {
                        email: faker.internet.email({ allowSpecialCharacters: Math.random() < 0.3 }),
                        password: randomPassword()
                    };
                    runTest(`#${i}`);
                }
            });

            suite("Email providers", () => {
                const emailProviders = ["gmail.com", "yahoo.com", "outlook.com", "queensu.ca", "mail.utoronto.ca",
                    "rogers.com", "hotmail.com", "aol.com", "icloud.com", "protonmail.com", "temp-mail.org"];
                for (const provider of emailProviders) {
                    testData = {
                        email: faker.internet.email({ provider: provider }),
                        password: randomPassword(),
                    };
                    runTest(provider);
                }
            });

            testData = {
                email: faker.internet.email(),
                password: faker.internet.password({ length: 6 }),
            };
            runTest(`Minimum password length (6)`);
        });

        suite('Failure cases', () => {

            suiteSetup(() => {
                console.log("===================================");
                console.log("Test case: Create account (failure)");
                console.log("===================================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

            let testData: any;
            const runTest = (description: string, errMsg: string) => {
                const inputCopy = testData; // Original may be updated by later test case before running
                return (
                    test(description, () => {
                        if (inputCopy) {
                            console.log(`Creating account for ${inputCopy.email} with password ${inputCopy.password}...`);
                        } else {
                            console.log(`Creating account with invalid input structure...`);
                        }

                        return callOnCallFunction("createAccount", inputCopy)
                            .then(() => { throw new Error("Expected createAccount to fail"); })
                            .catch((err: HttpsError) => expect(errMsg).to.equal(err.message));
                    })
                );
            }

            suite("Invalid email", () => {
                const emails: any[] = [undefined, null, "", 12345, 10.5, "test.at.test.com", "open LMS@gmail.com", "test@test@com"];
                for (const email of emails) {
                    testData = {
                        email: email,
                        password: randomPassword(),
                    };
                    const errMsg = !email
                        ? "ValidationError: email is a required field"
                        : typeof email !== "string"
                            ? "ValidationError: email must be a `string` type, but the final value was: `" + email + "`."
                            : "ValidationError: email must be a valid email";

                    runTest(String(email), errMsg);
                }
            });

            suite("Invalid password", () => {
                const passwords: any[] = [undefined, null, "", 12345, 10.5, "1", "12", "123", "1234", "12345"];
                for (const password of passwords) {
                    testData = {
                        email: faker.internet.email(),
                        password: password,
                    };
                    const errMsg = !password
                        ? "ValidationError: password is a required field"
                        : typeof password !== "string"
                            ? "ValidationError: password must be a `string` type, but the final value was: `" + password + "`."
                            : "ValidationError: Password must be at least six characters long";

                    runTest(String(password), errMsg);
                }
            });

            testData = {
                description: `Email in use #1`,
                email: DataGenerator.getDummyLearnerAccount().email,
                password: randomPassword(),
            };

            runTest("Email in use #1", `Email ${testData.email} is already in use`);

            testData = {
                description: `Email in use #2`,
                email: DataGenerator.getDummyLearnerAccount().email,
                password: randomPassword(),
            };
            runTest("Email in use #2", `Email ${testData.email} is already in use`);
        });
    });

    /**
     * Tests for resetPassword endpoint
     */
    suite("Reset password", () => {

        suite('Success cases', () => {

            suiteSetup(() => {
                console.log("===================================");
                console.log("Test case: Reset password (success)");
                console.log("===================================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

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

            testData = { email: DataGenerator.getDummyLearnerAccount().email };
            runTest("Dummy learner email");

            testData = { email: DataGenerator.getDummyAdminAccount().email };
            runTest("Dummy admin email");
        });

        suite('Failure cases', () => {

            suiteSetup(() => {
                console.log("===================================");
                console.log("Test case: Reset password (failure)");
                console.log("===================================");

                console.log("No setup required for this suite");
            });

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

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


    /**
     * Tests for getProfile endpoint
     */
    suite("Get profile", () => {

        suite('Success cases', () => {

            suiteSetup(() => {
                console.log("================================");
                console.log("Test case: Get profile (success)");
                console.log("================================");

                return DataGenerator.generateDummyAccounts();
            });

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

            let testData: { uid: string };
            let expected: {
                name: string,
                email: string,
                signUpDate: number,
                completedCourses: string[],
            };

            const runTest = (description: string) => {
                const inputCopy = testData; // Original may be updated by later test case before running
                return (
                    test(description, () => {
                        console.log(`Getting profile for ${inputCopy.uid}`);
                        return callOnCallFunction("getProfile", inputCopy)
                            .then((result) => {
                                expect(result.data).to.be.an('object');
                                expect(result.data).to.have.property('email');
                                expect(result.data).to.have.property('uid');
                                expect(result.data).to.have.property('role');
                                expect(result.data).to.have.property('courses');
                                expect(result.data).to.have.property('quizAttempts');
                            });
                    })
                );
            }

        });

        suite('Failure cases', () => {

            suiteSetup(() => {
                console.log("================================");
                console.log("Test case: Get profile (failure)");
                console.log("================================");

                console.log("No setup required for this suite");
            });

            suiteTeardown(function() {
                this.timeout(20_000);
                return DataGenerator.cleanTestData();
            });

        });
    });
});
