import { expect } from "chai";
import { callOnCallFunction, randomString, randomInt } from "../../helpers/helpers";
import { HttpsError } from "firebase-functions/v2/https";
import { dummyLearnerAccount, dummyAdminAccount } from "../../helpers/setupDummyData";
import { addTestUser } from "../../helpers/testDataToClean";
import { faker } from "@faker-js/faker";

const randomPassword = () => faker.internet.password({ length: randomInt(6, 200), memorable: Math.random() < 0.3 });

describe('Success cases for createAccount endpoint...', () => {

    interface TestInput {
        description: string,
        email: string,
        password: string,
    }

    let testNumber = 0;
    let testData: TestInput;
    const test = () => {
        ++testNumber;
        const inputCopy = testData; // Original may be updated by later test case before running

        return (
            describe(`#${testNumber}: ${inputCopy.description} ('${inputCopy.email}' '${inputCopy.password}')`, () => {
                it("create account successfully", () =>
                    callOnCallFunction("createAccount", inputCopy)
                        .then((result) => {
                                expect(result.data).to.be.a('string');
                                expect(result.data).to.match(new RegExp("^[a-zA-Z0-9]{28}$"));
                                addTestUser(inputCopy.email, <string> result.data);
                            }
                        )
                )
            })
        );
    }

    // 10 randomly generated email/password combinations
    for (let i = 1; i <= 10; ++i) {
        testData = {
            description: `Random #${i}`,
            email: faker.internet.email({ allowSpecialCharacters: Math.random() < 0.3 }),
            password: randomPassword()
        };
        test();
    }

    const emailProviders = ["gmail.com", "yahoo.com", "outlook.com", "queensu.ca", "mail.utoronto.ca"];
    for (const provider of emailProviders) {
        testData = {
            description: `${provider} provider`,
            email: faker.internet.email({ provider: provider }),
            password: randomPassword(),
        };
        test();
    }

    testData = {
        description: `Minimum password length (6)`,
        email: faker.internet.email(),
        password: faker.internet.password({ length: 6 }),
    };
    test();
});

describe('Failure cases for createAccount endpoint...', () => {

    interface TestInput {
        description: string,
        email: any,
        password: any,
    }

    let testNumber = 0;
    let testData: TestInput;
    const test = (errMsg: string, errCode: string) => {
        ++testNumber;
        const inputCopy = testData; // Original may be updated by later test case before running

        return (
            describe(`#${testNumber}: ${inputCopy.description} ('${inputCopy.email}' '${inputCopy.password}')`, () => {
                it("create account failed", () =>
                    callOnCallFunction("createAccount", inputCopy)
                        .then(() => { throw new Error("Expected createAccount to fail"); })
                        .catch((err: HttpsError) => {
                            expect(err.code).to.equal(errCode);
                            expect(err.message).to.equal(errMsg);
                        })
                )
            })
        );
    }

    testData = {
        description: `Invalid email #1`,
        email: `test.at.test.com`,
        password: randomPassword(),
    };
    test("ValidationError: email must be a valid email", "functions/invalid-argument");

    testData = {
        description: `Invalid email #2`,
        email: `test@test`,
        password: randomPassword(),
    };
    test(`Email ${testData.email} is invalid`, "functions/invalid-argument");

    testData = {
        description: `Invalid email #3`,
        email: `open LMS@gmail.com`,
        password: randomPassword(),
    };
    test(`ValidationError: email must be a valid email`, "functions/invalid-argument");

    testData = {
        description: `Invalid email #4`,
        email: `test@test@com`,
        password: randomPassword(),
    };
    test(`ValidationError: email must be a valid email`, "functions/invalid-argument");

    testData = {
        description: `Invalid email #5`,
        email: "",
        password: randomPassword(),
    };
    test(`ValidationError: email is a required field`, "functions/invalid-argument");

    testData = {
        description: `Invalid email #6`,
        email: null,
        password: randomPassword(),
    };
    test(`ValidationError: email is a required field`, "functions/invalid-argument");

    testData = {
        description: `Invalid email #7`,
        email: 12345,
        password: randomPassword(),
    };
    test("ValidationError: email must be a `string` type, but the final value was: `12345`.", "functions/invalid-argument");

    testData = {
        description: `Email in use #1`,
        email: dummyLearnerAccount.email,
        password: randomPassword(),
    };
    test(`Email ${testData.email} is already in use`, "functions/already-exists");

    testData = {
        description: `Email in use #2`,
        email: dummyAdminAccount.email,
        password: randomPassword(),
    };
    test(`Email ${testData.email} is already in use`, "functions/already-exists");

    testData = {
        description: `Invalid password #1`,
        email: faker.internet.email(),
        password: ""
    };
    test(`ValidationError: password is a required field`, "functions/invalid-argument");

    testData = {
        description: `Invalid password #2`,
        email: faker.internet.email(),
        password: null
    };
    test(`ValidationError: password is a required field`, "functions/invalid-argument");

    testData = {
        description: `Invalid password #3`,
        email: faker.internet.email(),
        password: 12345
    };
    test("ValidationError: password must be a `string` type, but the final value was: `12345`.", "functions/invalid-argument");

    for (let i = 1; i < 6; ++i) {
        testData = {
            description: `Invalid password #${i + 3}`,
            email: faker.internet.email(),
            password: randomString(i)
        };
        test(`ValidationError: Password must be at least six characters long`, "functions/invalid-argument");
    }
});
