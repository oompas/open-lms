import "./runOrder";
import { HttpsError } from "firebase-functions/v2/https";
import testEnv from "../index.test";
import { adminAuth } from "./config/adminSetup";
import { cleanTempFiles, getTestUsers } from "./testData";

suite("Clean up dummy account", () => {
    teardown(() => {
        testEnv.cleanup;
    });

    test("Delay cleanup so all triggers can finish...", async function() {
        this.timeout(21_000);
        await new Promise(res => setTimeout(res, 20_000)); // Make sure the onUserSignup() triggers are all done
    });

    test("Delete test user accounts", async function() {
        this.timeout(30_000);

        const usersToClean: { email: string, uid: string }[] = getTestUsers();
        const numTestUsers: number = usersToClean.length;

        console.log(`Deleting ${numTestUsers} test users...`);
        await Promise.all(usersToClean.map((user) =>
            adminAuth.deleteUser(user.uid)
                .catch((err) => { throw new HttpsError('internal', `Error deleting user ${user.email} (${user.uid}): ${err}`); })
        ))
            .then(() => console.log(`Successfully deleted ${numTestUsers} test users`))
            .catch((err) => { throw new HttpsError('internal', `Error deleting test users: ${err}`); });
    });

    test("Remove temporary test files", () => {
        cleanTempFiles();
    });
});
