import { HttpsError } from "firebase-functions/v2/https";
import "./runOrder";
import testEnv from "../index.test";
import { adminAuth, adminDb } from "./adminSetup";
import { readFileSync, rm } from "fs";
import { testUserFilePath, tmpDirPath } from "./testDataToClean";

describe("Clean up dummy account", () => {
    after(() => {
        testEnv.cleanup;
    });

    it("Delay cleanup so all triggers can finish...", async function() {
        this.timeout(21_000);
        await new Promise(res => setTimeout(res, 20_000)); // Make sure the onUserSignup() triggers are all done
    });

    it("Delete test user accounts", async function() {
        this.timeout(30_000);

        // Accounts
        // const testUsers: { id: string, email: string }[] = await adminDb.collection("/User/")
        //     .where("unitTest", "==", true)
        //     .get()
        //     .then((users) => users.docs.map((doc) => ({ id: doc.id, email: doc.data().email })))
        //     .catch((err) => { throw new HttpsError('internal', `Error getting test users: ${err}`); });
        // const numTestUsers = testUsers.length;
        const usersToClean: { email: string, uid: string }[] = JSON.parse(readFileSync(testUserFilePath, "utf-8"));
        const numTestUsers: number = usersToClean.length;
        console.log(`Test users: ${JSON.stringify(usersToClean, null, 4)}`);
        console.log(`Num test users: ${numTestUsers}`);

        await Promise.all(usersToClean.map((user) =>
            adminAuth.deleteUser(user.uid)
                .then(() => console.log(`Successfully deleted test user ${user.email} (${user.uid})`))
                .catch((err) => { throw new HttpsError('internal', `Error deleting user ${user.email} (${user.uid}): ${err}`); })
        ))
            .then(() => console.log(`Successfully deleted ${numTestUsers} test users`))
            .catch((err) => { throw new HttpsError('internal', `Error deleting test users: ${err}`); });
    });

    it("Remove temporary files", () => {
        rm(tmpDirPath, { recursive: true }, (err) => {
            if (err) {
                throw new Error(`Error removing tmp directory: ${err}`);
            }
            console.log("Successfully deleted temporary files");
        });
    });
});
