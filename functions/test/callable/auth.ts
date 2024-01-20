import { createAccount } from "../../src";
import { assert } from "chai";
import testEnv from "../index.test";
import { randomLengthString, randomString } from "../helpers/helpers";
import { getAuth } from "firebase-admin/auth";

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

                    const auth = getAuth();
                    const uid = await auth.getUserByEmail(input.testEmail)
                        .then((user) => { console.log(".then() worked"); return user.uid; })
                        .catch((err) => console.log('Error uid catch: ' + err));
                    await auth.deleteUser(uid);
                });
            })
        })
    );
}

describe('Success cases for createAccount endpoint...', () => {

    const auth = getAuth();
    let testData: TestInput;
    const test = async () => {
        testSuccess(testData);

        //console.log("running cslg...");
        //console.log(testData.testEmail);
        //const uid = await auth.getUserByEmail(testData.testEmail).then((user) => { console.log(".then() worked");
        // return user.uid; }).catch((err) => console.log('Error uid catch: ' + err));
        //console.log(uid);
        //await auth.deleteUser(uid);
    }

    testData = {
        description: "Gmail #1",
        testEmail: "firebase_unit_tests_create_account_1@gmail.com",
        testPassword: "password12345",
    };
    test();

    /*
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
        description: "Min password length",
        testEmail: "firebase_unit_tests_create_account_5@gmail.com",
        testPassword: randomString(6),
    };
    test();

    testData = {
        description: "Max password length",
        testEmail: "firebase_unit_tests_create_account_6@gmail.com",
        testPassword: randomString(30),
    };
    test();

    for (let i = 1; i <= 10; ++i) {
        testData = {
            description: `Random password length #${i}`,
            testEmail: `firebase_unit_tests_create_account_${6 + i}@gmail.com`,
            testPassword: randomLengthString(6, 30),
        };
        test();
    }
    */
});
