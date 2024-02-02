import { expect } from "chai";
import { callOnCallFunction, randomString, TEST_EMAIL_PREFIX } from "./helpers";
import { adminAuth, adminDb } from "./adminSetup";

const dummyLearnerAccount = { email: TEST_EMAIL_PREFIX + "dummy_learner_account@gmail.com", password: randomString(20) };

describe("Create dummy learner account", () => {
    it("Create dummy account", () => {
        return callOnCallFunction("createAccount", dummyLearnerAccount).then((result) =>
            expect(result).to.equal(`Successfully created new user ${dummyLearnerAccount.email}`)
        )
    });
});

const dummyAdminAccount = { email: TEST_EMAIL_PREFIX + "dummy_admin_account@gmail.com", password: randomString(20) };

describe("Create dummy admin account", () => {
    it("Create dummy account", async () => {
        console.log(`Creating dummy admin account ${dummyAdminAccount.email}`);
        await callOnCallFunction("createAccount", dummyAdminAccount).then((result) => {
            expect(result).to.equal(`Successfully created new user ${dummyAdminAccount.email}`);
        });

        console.log(`Getting uid for ${dummyAdminAccount.email}`);
        const uid = await adminAuth.getUserByEmail(dummyAdminAccount.email)
            .then((user) => user.uid)
            .catch((err) => { throw new Error(`Error getting admin user's uid: ${err}`); });

        console.log(`Updating user document for ${dummyAdminAccount.email} to admin permissions`);
        await adminDb.doc(`/User/${uid}`)
            .update({ admin: true })
            .then(() => console.log(`Successfully updated user document for ${dummyAdminAccount.email} to admin permissions`))
            .catch((err) => { throw new Error(`Error updating user document for ${dummyAdminAccount.email} to admin permissions: ${err}`); });

        console.log(`Verifying user's custom claims include admin permissions`);
        return adminAuth.getUser(uid)
            .then((user) => expect(user.customClaims).to.deep.equal({ admin: true }))
            .catch((err) => { throw new Error(`Error getting admin user's custom claims: ${err}`); })
    });
});

export { dummyLearnerAccount, dummyAdminAccount };
