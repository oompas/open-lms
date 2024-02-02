import { HttpsError } from "firebase-functions/v2/https";
import "./runOrder";
import testEnv from "../index.test";
import { adminAuth, adminDb } from "./adminSetup";

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
        const testUsers: { id: string, email: string }[] = await adminDb.collection("/User/")
            .where("unitTest", "==", true)
            .get()
            .then((users) => users.docs.map((doc) => ({ id: doc.id, email: doc.data().email })))
            .catch((err) => { throw new HttpsError('internal', `Error getting test users: ${err}`); });
        const numTestUsers = testUsers.length;

        await Promise.all(testUsers.map((user) =>
            adminAuth.deleteUser(user.id)
                .then(() => console.log(`Successfully deleted test user ${user.email} (${user.id})`))
                .catch((err) => { throw new HttpsError('internal', `Error deleting user ${user.email} (${user.id}): ${err}`); })
        ))
            .then(() => console.log(`Successfully deleted ${numTestUsers} test users`))
            .catch(() => { throw new HttpsError('internal', `Error deleting test users`); });
    });
});
