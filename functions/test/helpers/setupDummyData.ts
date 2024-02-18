import { expect } from "chai";
import { callOnCallFunction } from "./helpers";
import { adminAuth, adminDb } from "./config/adminSetup";
import { dummyLearnerAccount, dummyAdminAccount, addTestUser, cleanTempFiles, getTestUsers } from "./testData";
import { HttpsError } from "firebase-functions/v2/https";

suite("Set up test data", () => {
    test("Clean data from previous runs", async function() {
        this.timeout(30_000);

        const usersToClean: { email: string, uid: string }[] = getTestUsers();
        const numTestUsers: number = usersToClean.length;

        if (numTestUsers !== 0) {
            console.log(`Deleting ${numTestUsers} test users...`);
            await Promise.all(usersToClean.map((user) =>
                adminAuth.deleteUser(user.uid)
                    .catch((err) => { throw new HttpsError('internal', `Error deleting user ${user.email} (${user.uid}): ${err}`); })
            ))
                .then(() => console.log(`Successfully deleted ${numTestUsers} test users`))
                .catch((err) => { throw new HttpsError('internal', `Error deleting test users: ${err}`); });
        } else {
            console.log("No test users to delete");
        }

        console.log("\nCleaning temporary test files...");
        cleanTempFiles();
        console.log("Successfully cleaned temporary test files");
    });

    test("Create dummy account", () => {
        return callOnCallFunction("createAccount", dummyLearnerAccount).then(async (result) => {
            expect(result.data).to.be.a('string');
            expect(result.data).to.match(new RegExp("^[a-zA-Z0-9]{28}$"));
            const uid: string = <string> result.data;
            addTestUser(dummyLearnerAccount.email, dummyLearnerAccount.password, uid);

            console.log(`Manually verifying email for ${dummyLearnerAccount.email}`);
            await adminAuth.updateUser(uid, { emailVerified: true })
                .catch((err) => { throw new Error(`Error manually verifying email for ${dummyLearnerAccount.email}: ${err}`); });

            return <string>result.data;
        })
    });
    test("Create dummy account", async function() {
        this.timeout(40_000);

        console.log(`Creating dummy admin account ${dummyAdminAccount.email}`);
        const uid: string = await callOnCallFunction("createAccount", dummyAdminAccount).then((result) => {
            expect(result.data).to.be.a('string');
            expect(result.data).to.match(new RegExp("^[a-zA-Z0-9]{28}$"));
            addTestUser(dummyAdminAccount.email, dummyAdminAccount.password, <string> result.data);
            return <string> result.data;
        });

        console.log(`Manually verifying email for ${dummyAdminAccount.email}`);
        await adminAuth.updateUser(uid, { emailVerified: true })
            .catch((err) => { throw new Error(`Error manually verifying email for ${dummyAdminAccount.email}: ${err}`); });

        await new Promise(res => setTimeout(res, 10_000)); // Make sure the User document was created

        console.log(`Updating user document for ${dummyAdminAccount.email} to admin permissions`);
        await adminDb.doc(`/User/${uid}`)
            .update({ admin: true })
            .then(() => console.log(`Successfully updated user document for ${dummyAdminAccount.email} to admin permissions`))
            .catch((err) => { throw new Error(`Error updating user document for ${dummyAdminAccount.email} to admin permissions: ${err}`); });
        await new Promise(res => setTimeout(res, 10_000)); // Wait for the custom claims to be updated

        console.log(`Verifying user's custom claims include admin permissions`);
        return adminAuth.getUser(uid)
            .then((user) => expect(user.customClaims).to.deep.equal({ admin: true }))
            .catch((err) => { throw new Error(`Error getting admin user's custom claims: ${err}`); })
    });

});
