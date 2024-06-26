import { callOnCallFunction, callOnCallFunctionWithAuth, delay, randomString } from "./helpers";
import { expect } from "chai";
import { adminAuth, adminDb } from "./config/adminSetup";
import CourseData from "./dummyData/courses.json";

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
    static #dummyCourseData: any[] = [];

    // @ts-ignore
    static #dummyAccountsCreated = false;

    // @ts-ignore
    static #dummyCoursesCreated = false;

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

        await delay(4_000); // Ensure the user document is created

        console.log(`Automatically verifying email and giving admin permissions to ${adminEmail}`);
        await adminDb.doc(`/User/${uid}`)
            .update({ admin: true })
            .then(() => console.log(`Successfully updated user document for ${adminEmail} to admin permissions`))
            .catch((err) => { throw new Error(`Error updating user document for ${adminEmail} to admin permissions: ${err}`); });

        await adminAuth.updateUser(uid, { emailVerified: true })
            .then(() => console.log(`Successfully verified email for ${adminEmail}`))
            .catch((err) => { throw new Error(`Error manually verifying email for ${adminEmail}: ${err}`); });

        await delay(4_000); // Ensure the admin permission trigger completes

        DataGenerator.#dummyAccountsCreated = true;
    }

    /**
     * Generates dummy courses for testing
     */
    public static async generateDummyCourses() {

        if (DataGenerator.#dummyCoursesCreated) {
            console.log("Dummy courses already created, skipping...");
            return;
        }

        console.log("Generating dummy courses...");

        await Promise.all(CourseData.map(async (course) => {
            console.log(`Generating dummy course ${course.name}...`);

            await callOnCallFunctionWithAuth("addCourse", course, DataGenerator.#dummyAdminAccount)
                .then((result) => {
                    expect(result.data).to.be.a('string');
                    expect(result.data).to.match(new RegExp("^[a-zA-Z0-9]{20}$"));
                    const courseWithId = {
                        ...course,
                        id: result.data
                    };
                    this.#dummyCourseData.push(courseWithId);
                });
        }));
        DataGenerator.#dummyCoursesCreated = true;
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
     * Gets the dummy courses
     */
    public static getDummyCourseData = () => DataGenerator.#dummyCourseData;

    /**
     * Cleans all test data (whole database + all accounts); must be run after every a test suite
     */
    public static async cleanTestData() {

        console.log("\nCleaning all test data...");

        const users = await adminAuth.listUsers().then((listUsersResult) => listUsersResult.users);
        await Promise.all([...users.map((user) => adminAuth.deleteUser(user.uid))]);

        await delay(10_000); // Wait for triggers to finish

        DataGenerator.#dummyAccountsCreated = false;
        DataGenerator.#dummyCoursesCreated = false;

        console.log("Successfully cleaned test accounts (triggers will remove database data)\n\n");
    }
}

export default DataGenerator;
