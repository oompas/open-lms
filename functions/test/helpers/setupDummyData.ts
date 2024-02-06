import { expect } from "chai";
import { callOnCallFunction, randomString, TEST_EMAIL_PREFIX } from "./helpers";
import { adminAuth, adminDb } from "./adminSetup";
import { addTestUser } from "./testDataToClean";

const dummyLearnerAccount = { email: TEST_EMAIL_PREFIX + "dummy_learner_account@gmail.com", password: randomString(20) };

describe("Create dummy learner account", () => {
    it("Create dummy account", () => {
        return callOnCallFunction("createAccount", dummyLearnerAccount).then((result) => {
            expect(result.data).to.be.a('string');
            expect(result.data).to.match(new RegExp("^[a-zA-Z0-9]{28}$"));
            addTestUser(dummyLearnerAccount.email, <string> result.data);
            return <string>result.data;
        })
    });
});

const dummyAdminAccount = { email: TEST_EMAIL_PREFIX + "dummy_admin_account@gmail.com", password: randomString(20) };

describe("Create dummy admin account", () => {
    it("Create dummy account", async function() {
        this.timeout(40_000);

        console.log(`Creating dummy admin account ${dummyAdminAccount.email}`);
        const uid: string = await callOnCallFunction("createAccount", dummyAdminAccount).then((result) => {
            expect(result.data).to.be.a('string');
            expect(result.data).to.match(new RegExp("^[a-zA-Z0-9]{28}$"));
            addTestUser(dummyAdminAccount.email, <string> result.data);
            return <string> result.data;
        });

        // console.log(`Getting uid for ${dummyAdminAccount.email}`);
        // const uid = await adminAuth.getUserByEmail(dummyAdminAccount.email)
        //     .then((user) => user.uid)
        //     .catch((err) => { throw new Error(`Error getting admin user's uid: ${err}`); });

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

export { dummyLearnerAccount, dummyAdminAccount };
