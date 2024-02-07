import testEnv from "../index.test";
import { createAccount } from "../../src";
import { assert } from "chai";

const dummyAccount = { email: "firebase_ut_account@gmail.com", password: "password12345" };

describe("Setup dummy account", () => {
    it("Create dummy account", () => {

        const data = testEnv.firestore.makeDocumentSnapshot(dummyAccount, `TestInput/createAccount#ut_dummy`);

        // @ts-ignore
        return testEnv.wrap(createAccount)(data).then(async (result: string) => {
            assert.equal(result, `Successfully created new user ${dummyAccount.email}`,
                "Response message does not match expected");
        });
    });
});

export { dummyAccount };
