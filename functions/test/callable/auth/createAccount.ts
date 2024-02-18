import { expect } from "chai";
import { callOnCallFunction, randomInt } from "../../helpers/helpers";
import { HttpsError } from "firebase-functions/v2/https";
import { dummyLearnerAccount, dummyAdminAccount } from "../../helpers/testData";
import { addTestUser } from "../../helpers/testData";
import { faker } from "@faker-js/faker";

suite("Create account", () => {

    const randomPassword = () => faker.internet.password({ length: randomInt(6, 200), memorable: Math.random() < 0.3 });

    suite('Success cases', () => {

        interface TestInput {
            description: string,
            email: string,
            password: string,
        }

        let testData: TestInput;
        const runTest = () => {
            const inputCopy = testData; // Original may be updated by later test case before running

            return (
                test(inputCopy.description, () => {
                    console.log(`Creating account for ${inputCopy.email} with password ${inputCopy.password}`);
                    return callOnCallFunction("createAccount", inputCopy)
                        .then((result) => {
                                expect(result.data).to.be.a('string');
                                expect(result.data).to.match(new RegExp("^[a-zA-Z0-9]{28}$"));

                                console.log("\nAccount created successfully, adding to test data file...");
                                addTestUser(inputCopy.email, inputCopy.password, <string> result.data);
                                console.log(`Successfully added ${inputCopy.email} to test data file`);
                            }
                        );
                })
            );
        }

        suite("Random inputs", () => {
            for (let i = 1; i <= 10; ++i) {
                testData = {
                    description: `#${i}`,
                    email: faker.internet.email({ allowSpecialCharacters: Math.random() < 0.3 }),
                    password: randomPassword()
                };
                runTest();
            }
        });

        suite("Email providers", () => {
            const emailProviders = ["gmail.com", "yahoo.com", "outlook.com", "queensu.ca", "mail.utoronto.ca",
                "rogers.com", "hotmail.com", "aol.com", "icloud.com", "protonmail.com", "temp-mail.org"];
            for (const provider of emailProviders) {
                testData = {
                    description: provider,
                    email: faker.internet.email({ provider: provider }),
                    password: randomPassword(),
                };
                runTest();
            }
        });

        testData = {
            description: `Minimum password length (6)`,
            email: faker.internet.email(),
            password: faker.internet.password({ length: 6 }),
        };
        runTest();
    });

    suite('Failure cases', () => {

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
            const emails: any[] = [undefined, null, "", 12345, "test.at.test.com", "open LMS@gmail.com", "test@test@com"];
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
            const passwords: any[] = [undefined, null, "", 12345, "1", "12", "123", "1234", "12345"];
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
            email: dummyLearnerAccount.email,
            password: randomPassword(),
        };

        runTest("Email in use #1", `Email ${testData.email} is already in use`);

        testData = {
            description: `Email in use #2`,
            email: dummyAdminAccount.email,
            password: randomPassword(),
        };
        runTest("Email in use #2", `Email ${testData.email} is already in use`);
    });
});
