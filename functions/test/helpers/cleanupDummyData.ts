import { HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { dummyAccount } from "./setupDummyData";
import "./runOrder";

describe("Clean up dummy account", () => {
    it("Delete dummy account", async function() {
        this.timeout(30_000);
        await new Promise(res => setTimeout(res, 10_000)); // Make sure all triggers are done

        const auth = getAuth();
        return auth.getUserByEmail(dummyAccount.email)
            .then((user: { uid: any; }) => auth.deleteUser(user.uid))
            .catch((err: any) => { throw new HttpsError('internal', `Error getting uid for ${dummyAccount.email}: ${err}`); });
    });
});
