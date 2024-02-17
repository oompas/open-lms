import "./runOrder";
import { HttpsError } from "firebase-functions/v2/https";
import testEnv from "../index.test";
import { adminAuth } from "./config/adminSetup";
import { readFileSync, rm } from "fs";
import { testUserFilePath, tmpDirPath } from "./testData";

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

        const usersToClean: { email: string, uid: string }[] = JSON.parse(readFileSync(testUserFilePath, "utf-8"));
        const numTestUsers: number = usersToClean.length;

        console.log(`Deleting ${numTestUsers} test users...`);
        await Promise.all(usersToClean.map((user) =>
            adminAuth.deleteUser(user.uid)
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
            console.log("Successfully deleted temporary test files");
        });
    });
});
