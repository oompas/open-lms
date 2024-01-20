import { createAccount } from "../../../src";
import { assert } from "chai";
import testEnv from "../../index.test";
import { randomString } from "../../helpers/helpers";
import { getAuth } from "firebase-admin/auth";
import { HttpsError } from "firebase-functions/v2/https";

interface TestInput {
    description: string,
    testEmail: string,
    testPassword: string,
}
let testNumber = 0; // Increment each time

const testSuccess = (input: TestInput) => {
    ++testNumber;

    return (
        describe(`#${testNumber}: ` + input.description, () => {
            it("create account successfully", async () => {

                const data = testEnv.firestore.makeDocumentSnapshot({
                    email: input.testEmail,
                    password: input.testPassword
                }, `TestInput/createAccount#${testNumber}`);

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
        testSuccess(testData);
        testAccounts.push(testData.testEmail);
    }

    // Clean up accounts after tests are done
    const auth = getAuth();
    after(async function done() {
        this.timeout(30_000);
        await new Promise(res => setTimeout(res, 10_000)); // Make sure the onUserSignup() triggers are all done

        await Promise.all(testAccounts.map((email) => {
            return auth.getUserByEmail(email)
                .then((user) => auth.deleteUser(user.uid))
                .catch((err) => { throw new HttpsError('internal', `Error getting uid for ${testData.testEmail}: ${err}`); });
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
