import {  expect } from "chai";
import { callOnCallFunction, randomString } from "../../helpers/helpers";
import { HttpsError } from "firebase-functions/v2/https";
import { dummyAccount } from "../../helpers/setupDummyData";

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
            describe(`#${testNumber}: ` + inputCopy.description, () => {
                it("create account successfully", () =>
                    callOnCallFunction("createAccount", inputCopy)
                        .then((result) =>
                            expect(result.data).to.equal(`Successfully created new user ${inputCopy.email}`)
                        )
                )
            })
        );
    }

    testData = {
        description: "Gmail #1",
        email: "firebase_unit_tests_create_account_1@gmail.com",
        password: "password12345",
    };
    test();

    testData = {
        description: "Gmail #2",
        email: "firebase_unit_tests_create_account_2@gmail.com",
        password: "password12345",
    };
    test();

    testData = {
        description: "queensu",
        email: "firebase_unit_tests_create_account_3@queensu.ca",
        password: "password12345",
    };
    test();

    testData = {
        description: "outlook",
        email: "firebase_unit_tests_create_account_4@outlook.com",
        password: "password12345",
    };
    test();

    testData = {
        description: "yahoo",
        email: "firebase_unit_tests_create_account_5@yahoo.com",
        password: "password12345",
    };
    test();

    testData = {
        description: `Minimum password length `,
        email: `firebase_unit_tests_create_account_${6}@gmail.com`,
        password: randomString(6),
    };
    test();

    testData = {
        description: `Maximum password length`,
        email: `firebase_unit_tests_create_account_${7}@gmail.com`,
        password: randomString(100),
    };
    test();

    // Test random password lengths 21 < length < 100
    for (let i = 0; i < 20; ++i) {
        const length = Math.floor(Math.random() * 79) + 21;
        testData = {
            description: `Password length ${length}`,
            email: `firebase_unit_tests_create_account_${8 + i}@gmail.com`,
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
    const test = (errMsg: string) => {
        ++testNumber;
        const inputCopy = testData; // Original may be updated by later test case before running

        return (
            describe(`#${testNumber}: ` + inputCopy.description, () => {
                it("create account failed", () =>
                    callOnCallFunction("createAccount", inputCopy)
                        .then(() => { throw new Error("Expected createAccount to fail"); })
                        .catch((err: HttpsError) => {
                            expect(err.code).to.equal("invalid-argument");
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
    test(`Email ${testData.email} is invalid`);

    testData = {
        description: `Invalid email #2`,
        email: `test@test`,
        password: "password12345",
    };
    test(`Email ${testData.email} is invalid`);

    testData = {
        description: `Invalid email #3`,
        email: `open LMS@gmail.com`,
        password: "password12345",
    };
    test(`Email ${testData.email} is invalid`);

    testData = {
        description: `Invalid email #4`,
        email: `test@test@com`,
        password: "password12345",
    };
    test(`Email ${testData.email} is invalid`);

    testData = {
        description: `Invalid email #5`,
        email: "",
        password: "password12345",
    };
    test(`The parameter email is required`);

    testData = {
        description: `Invalid email #6`,
        email: null,
        password: "password12345",
    };
    test(`The parameter email is required`);

    testData = {
        description: `Invalid email #7`,
        email: 12345,
        password: "password12345",
    };
    test(`The parameter email is required`);

    testData = {
        description: `Email in use`,
        email: dummyAccount.email,
        password: "password123456",
    };
    test(`Email ${testData.email} is already in use`);

    testData = {
        description: `Invalid password #1`,
        email: `test@test.com`,
        password: ""
    };
    test(`The parameter password is required`);

    testData = {
        description: `Invalid password #2`,
        email: `test@test.com`,
        password: null
    };
    test(`The parameter password is required`);

    testData = {
        description: `Invalid password #3`,
        email: `test@test.com`,
        password: 12345
    };
    test(`The parameter password is required`);

    for (let i = 1; i < 6; ++i) {
        testData = {
            description: `Invalid password #${i + 3}`,
            email: `test@test.com`,
            password: randomString(i)
        };
        test(`Password is invalid. It must be a string with at least six characters.`);
    }

    testData = {
        description: `Invalid password #10`,
        email: `test@test.com`,
        password: randomString(101)
    };
    test(`Password can't be over 100 characters long`);

    testData = {
        description: `Invalid password #11`,
        email: `test@test.com`,
        password: randomString(1000)
    };
    test(`Password can't be over 100 characters long`);
});
