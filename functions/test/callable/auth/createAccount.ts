import { expect } from "chai";
import { callOnCallFunction, randomString, TEST_EMAIL_PREFIX } from "../../helpers/helpers";
import { HttpsError } from "firebase-functions/v2/https";
import { dummyLearnerAccount, dummyAdminAccount } from "../../helpers/setupDummyData";
import { addTestUser } from "../../helpers/testDataToClean";

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

        if (!inputCopy.email.startsWith(TEST_EMAIL_PREFIX)) {
            throw new Error("All test accounts must start with the prefix " + TEST_EMAIL_PREFIX);
        }

        return (
            describe(`#${testNumber}: ` + inputCopy.description, () => {
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

    testData = {
        description: "Gmail #1",
        email: TEST_EMAIL_PREFIX + "create_account_1@gmail.com",
        password: "password12345",
    };
    test();

    testData = {
        description: "Gmail #2",
        email: TEST_EMAIL_PREFIX + "create_account_2@gmail.com",
        password: "password12345",
    };
    test();

    testData = {
        description: "queensu",
        email: TEST_EMAIL_PREFIX + "create_account_3@queensu.ca",
        password: "password12345",
    };
    test();

    testData = {
        description: "outlook",
        email: TEST_EMAIL_PREFIX + "create_account_4@outlook.com",
        password: "password12345",
    };
    test();

    testData = {
        description: "yahoo",
        email: TEST_EMAIL_PREFIX + "create_account_5@yahoo.com",
        password: "password12345",
    };
    test();

    testData = {
        description: `Minimum password length `,
        email: TEST_EMAIL_PREFIX + `create_account_6@gmail.com`,
        password: randomString(6),
    };
    test();

    // Test random password lengths 6 - 200
    for (let i = 0; i < 20; ++i) {
        const length = Math.floor(Math.random() * 195) + 6;
        testData = {
            description: `Password length ${length}`,
            email: TEST_EMAIL_PREFIX + `create_account_${8 + i}@gmail.com`,
            password: randomString(length),
        };
        test();
    }
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
            describe(`#${testNumber}: ` + inputCopy.description, () => {
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
        password: "password12345",
    };
    test(`Email ${testData.email} is invalid`, "functions/invalid-argument");

    testData = {
        description: `Invalid email #2`,
        email: `test@test`,
        password: "password12345",
    };
    test(`Email ${testData.email} is invalid`, "functions/invalid-argument");

    testData = {
        description: `Invalid email #3`,
        email: `open LMS@gmail.com`,
        password: "password12345",
    };
    test(`Email ${testData.email} is invalid`, "functions/invalid-argument");

    testData = {
        description: `Invalid email #4`,
        email: `test@test@com`,
        password: "password12345",
    };
    test(`Email ${testData.email} is invalid`, "functions/invalid-argument");

    testData = {
        description: `Invalid email #5`,
        email: "",
        password: "password12345",
    };
    test(`The parameter email is required`, "functions/invalid-argument");

    testData = {
        description: `Invalid email #6`,
        email: null,
        password: "password12345",
    };
    test(`The parameter email is required`, "functions/invalid-argument");

    testData = {
        description: `Invalid email #7`,
        email: 12345,
        password: "password12345",
    };
    test(`The parameter email is required`, "functions/invalid-argument");

    testData = {
        description: `Email in use #1`,
        email: dummyLearnerAccount.email,
        password: "password123456",
    };
    test(`Email ${testData.email} is already in use`, "functions/already-exists");

    testData = {
        description: `Email in use #2`,
        email: dummyAdminAccount.email,
        password: "password123456",
    };
    test(`Email ${testData.email} is already in use`, "functions/already-exists");

    testData = {
        description: `Invalid password #1`,
        email: `test@test.com`,
        password: ""
    };
    test(`Password is invalid. It must be a string with at least six characters.`, "functions/invalid-argument");

    testData = {
        description: `Invalid password #2`,
        email: `test@test.com`,
        password: null
    };
    test(`The parameter password is required`, "functions/invalid-argument");

    testData = {
        description: `Invalid password #3`,
        email: `test@test.com`,
        password: 12345
    };
    test(`Password is invalid. It must be a string with at least six characters.`, "functions/invalid-argument");

    for (let i = 1; i < 6; ++i) {
        testData = {
            description: `Invalid password #${i + 3}`,
            email: `test@test.com`,
            password: randomString(i)
        };
        test(`Password is invalid. It must be a string with at least six characters.`, "functions/invalid-argument");
    }

    testData = {
        description: `Invalid password #10`,
        email: `test@test.com`,
        password: randomString(101)
    };
    test(`Password can't be over 100 characters long`, "functions/invalid-argument");

    testData = {
        description: `Invalid password #11`,
        email: `test@test.com`,
        password: randomString(1000)
    };
    test(`Password can't be over 100 characters long`, "functions/invalid-argument");
});
