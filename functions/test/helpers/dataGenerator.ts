import { callOnCallFunction, delay, randomString } from "./helpers";
import { expect } from "chai";
import { adminAuth, adminDb } from "./config/adminSetup";

class DataGenerator {

    // @ts-ignore
    static #dummyLearnerAccount = {
        email: "firebase_unit_tests_dummy_learner_account@gmail.com",
        password: randomString(20)
    };
    // @ts-ignore
    static #dummyAdminAccount = {
        email: "firebase_unit_tests_dummy_admin_account@gmail.com",
        password: randomString(20)
    };

    // @ts-ignore
    static #dummyAccountsCreated = false;

    /**
     * Creates a dummy learner and admin account
     */
    public static async generateDummyAccounts() {

        if (DataGenerator.#dummyAccountsCreated) {
            console.log("Dummy accounts already created, skipping...");
            return;
        }

        console.log("Generating dummy accounts...");



        const learnerEmail = DataGenerator.#dummyLearnerAccount.email;
        console.log(`Generating dummy learner account (${learnerEmail})...`);

        await callOnCallFunction("createAccount", DataGenerator.#dummyLearnerAccount).then(async (result) => {
            expect(result.data).to.be.a('string');
            expect(result.data).to.match(new RegExp("^[a-zA-Z0-9]{28}$"));

            console.log(`Automatically verifying email for ${learnerEmail}`);
            await adminAuth.updateUser(<string> result.data, { emailVerified: true })
                .catch((err) => { throw new Error(`Error manually verifying email for ${learnerEmail}: ${err}`); });
            console.log(`Successfully verified email for ${learnerEmail}`);
        });



        const adminEmail = DataGenerator.#dummyAdminAccount.email;
        console.log(`\nGenerating dummy admin account (${adminEmail})...`);

        const uid: string = await callOnCallFunction("createAccount", DataGenerator.#dummyAdminAccount).then((result) => {
            expect(result.data).to.be.a('string');
            expect(result.data).to.match(new RegExp("^[a-zA-Z0-9]{28}$"));

            return <string> result.data;
        });

        console.log(`Automatically verifying email and giving admin permissions to ${adminEmail}`);
        await adminDb.doc(`/User/${uid}`)
            .update({ admin: true })
            .then(() => console.log(`Successfully updated user document for ${adminEmail} to admin permissions`))
            .catch((err) => { throw new Error(`Error updating user document for ${adminEmail} to admin permissions: ${err}`); });

        await adminAuth.updateUser(uid, { emailVerified: true })
            .then(() => console.log(`Successfully verified email for ${adminEmail}`))
            .catch((err) => { throw new Error(`Error manually verifying email for ${adminEmail}: ${err}`); });

        DataGenerator.#dummyAccountsCreated = true;
    }

    /**
     * Gets the dummy learner account
     */
    public static getDummyLearnerAccount = () => DataGenerator.#dummyLearnerAccount;

    /**
     * Gets the dummy admin account
     */
    public static getDummyAdminAccount = () => DataGenerator.#dummyAdminAccount;

    /**
     * Cleans all test data (whole database + all accounts); must be run after every a test suite
     */
    public static async cleanTestData() {

        console.log("\nCleaning all test data...");

        const users = await adminAuth.listUsers().then((listUsersResult) => listUsersResult.users);
        await Promise.all([...users.map((user) => adminAuth.deleteUser(user.uid))]);

        await delay(10_000); // Wait for triggers to finish

        DataGenerator.#dummyAccountsCreated = false;

        console.log("Successfully cleaned test accounts (triggers will remove database data)\n\n");
    }
}

export default DataGenerator;
