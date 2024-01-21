import { createAccount } from "../../../src";
import { assert } from "chai";
import testEnv from "../../index.test";
import { randomString } from "../../helpers/helpers";
import { getAuth } from "firebase-admin/auth";
import { HttpsError } from "firebase-functions/v2/https";
import { dummyAccount } from "../../helpers/setupDummyData";

interface TestInput {
    description: string,
    testEmail: any,
    testPassword: any,
}
let testNumber = 0; // Increment each time

const testCreateAccount = (input: TestInput, errorMessage: undefined | string) => {
    ++testNumber;
    const message = errorMessage ? "fail to create account" : "create account successfully";

    return (
        describe(`#${testNumber}: ` + input.description, () => {
            it(message, () => {

                const data = testEnv.firestore.makeDocumentSnapshot({
                    email: input.testEmail,
                    password: input.testPassword
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
                    assert.equal(result, `Successfully created new user ${input.testEmail}`,
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
        testAccounts.push(testData.testEmail);
    }

    // Clean up accounts after tests are done
    const auth = getAuth();
    after(async function done() {
        this.timeout(30_000);
        await new Promise(res => setTimeout(res, 10_000)); // Make sure the onUserSignup() triggers are all done

        await Promise.all(testAccounts.map((email) => {
            return auth.getUserByEmail(email)
                .then((user: { uid: any; }) => auth.deleteUser(user.uid))
                .catch((err: any) => { throw new HttpsError('internal', `Error getting uid for ${testData.testEmail}: ${err}`); });
        }));
    });

    testData = {
        description: "Gmail #1",
        testEmail: "firebase_unit_tests_create_account_1@gmail.com",
        testPassword: "password12345",
    };
    test();

    testData = {
        description: "Gmail #2",
        testEmail: "firebase_unit_tests_create_account_2@gmail.com",
        testPassword: "password12345",
    };
    test();

    testData = {
        description: "queensu",
        testEmail: "firebase_unit_tests_create_account_3@queensu.ca",
        testPassword: "password12345",
    };
    test();

    testData = {
        description: "outlook",
        testEmail: "firebase_unit_tests_create_account_4@outlook.com",
        testPassword: "password12345",
    };
    test();

    testData = {
        description: "yahoo",
        testEmail: "firebase_unit_tests_create_account_5@yahoo.com",
        testPassword: "password12345",
    };
    test();

    testData = {
        description: `Minimum password length `,
        testEmail: `firebase_unit_tests_create_account_${6}@gmail.com`,
        testPassword: randomString(6),
    };
    test();

    testData = {
        description: `Maximum password length`,
        testEmail: `firebase_unit_tests_create_account_${7}@gmail.com`,
        testPassword: randomString(100),
    };
    test();

    // Test random password lengths 21 < length < 100
    for (let i = 0; i < 20; ++i) {
        const length = Math.floor(Math.random() * 79) + 21;
        testData = {
            description: `Password length ${length}`,
            testEmail: `firebase_unit_tests_create_account_${8 + i}@gmail.com`,
            testPassword: randomString(length),
        };
        test();
    }
});

describe('Failure cases for createAccount endpoint...', () => {

    let testData: TestInput;
    const test = (errMsg: string) => {
        testCreateAccount(testData, errMsg);
    }

    testData = {
        description: `Invalid email #1`,
        testEmail: `test.at.test.com`,
        testPassword: "password12345",
    };
    test(`Email ${testData.testEmail} is invalid`);

    testData = {
        description: `Invalid email #2`,
        testEmail: `test@test`,
        testPassword: "password12345",
    };
    test(`Email ${testData.testEmail} is invalid`);

    testData = {
        description: `Invalid email #3`,
        testEmail: `open LMS@gmail.com`,
        testPassword: "password12345",
    };
    test(`Email ${testData.testEmail} is invalid`);

    testData = {
        description: `Invalid email #4`,
        testEmail: `test@test@com`,
        testPassword: "password12345",
    };
    test(`Email ${testData.testEmail} is invalid`);

    testData = {
        description: `Invalid email #5`,
        testEmail: "",
        testPassword: "password12345",
    };
    test(`The parameter email is required`);

    testData = {
        description: `Invalid email #6`,
        testEmail: null,
        testPassword: "password12345",
    };
    test(`The parameter email is required`);

    testData = {
        description: `Invalid email #7`,
        testEmail: 12345,
        testPassword: "password12345",
    };
    test(`The parameter email is required`);

    testData = {
        description: `Email in use`,
        testEmail: dummyAccount.email,
        testPassword: "password123456",
    };
    test(`Email ${testData.testEmail} is already in use`);

    testData = {
        description: `Invalid password #1`,
        testEmail: `test@test.com`,
        testPassword: ""
    };
    test(`The parameter password is required`);

    testData = {
        description: `Invalid password #2`,
        testEmail: `test@test.com`,
        testPassword: null
    };
    test(`The parameter password is required`);

    testData = {
        description: `Invalid password #3`,
        testEmail: `test@test.com`,
        testPassword: 12345
    };
    test(`The parameter password is required`);

    for (let i = 1; i < 6; ++i) {
        testData = {
            description: `Invalid password #${i + 3}`,
            testEmail: `test@test.com`,
            testPassword: randomString(i)
        };
        test(`Password is invalid. It must be a string with at least six characters.`);
    }

    testData = {
        description: `Invalid password #10`,
        testEmail: `test@test.com`,
        testPassword: randomString(101)
    };
    test(`Password can't be over 100 characters long`);

    testData = {
        description: `Invalid password #11`,
        testEmail: `test@test.com`,
        testPassword: randomString(1000)
    };
    test(`Password can't be over 100 characters long`);
});
