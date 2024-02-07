import { createAccount } from "../../../src";
import { assert } from "chai";
import testEnv from "../../index.test";
import { randomString } from "../../helpers/helpers";
import { getAuth } from "firebase-admin/auth";
import { HttpsError } from "firebase-functions/v2/https";
import { dummyAccount } from "../../helpers/setupDummyData";

interface TestInput {
    description: string,
    email: any,
    password: any,
}
let testNumber = 0; // Increment each time

const testCreateAccount = (input: TestInput, errorMessage: undefined | string) => {
    ++testNumber;
    const message = errorMessage ? "fail to create account" : "create account successfully";

    return (
        describe(`#${testNumber}: ` + input.description, () => {
            it(message, () => {

                const data = testEnv.firestore.makeDocumentSnapshot({
                    email: input.email,
                    password: input.password
                }, `TestInput/createAccount#${testNumber}`);

                // Check if the call passes or fails as desired
                if (errorMessage) {
                    try { // @ts-ignore
                        return testEnv.wrap(createAccount)(data)
                            .then(() => { throw new Error("API call should fail"); })
                            .catch((err: any) => assert.equal(err.message, errorMessage));
                    } catch (err) { // @ts-ignore
                        assert.equal(err.message, errorMessage);
                        return;
                    }
                }

                // @ts-ignore
                return testEnv.wrap(createAccount)(data).then(async (result: string) => {
                    assert.equal(result, `Successfully created new user ${input.email}`,
                        "Response message does not match expected");
                });
            })
        })
    );
}

describe('Success cases for createAccount endpoint...', () => {

    let testData: TestInput;
    const testAccounts: string[] = [];
    const test = () => {
        testCreateAccount(testData, undefined);
        testAccounts.push(testData.email);
    }

    // Clean up accounts after tests are done
    const auth = getAuth();
    after(async function done() {
        this.timeout(30_000);
        await new Promise(res => setTimeout(res, 10_000)); // Make sure the onUserSignup() triggers are all done

        await Promise.all(testAccounts.map((email) => {
            return auth.getUserByEmail(email)
                .then((user: { uid: any; }) => auth.deleteUser(user.uid))
                .catch((err: any) => { throw new HttpsError('internal', `Error getting uid for ${testData.email}: ${err}`); });
        }));
    });

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

    testNumber = 0;
    let testData: TestInput;
    const test = (errMsg: string) => testCreateAccount(testData, errMsg);

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
