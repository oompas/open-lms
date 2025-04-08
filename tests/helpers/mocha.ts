import TestDatabaseHelper from "./database.ts";
import Constants from "./constants.ts";

const setupWipeDb = () => (
    setup(async function() {
        await TestDatabaseHelper.wipeDatabase();
    })
);

const sanitySkipDetailed = () => (
    suiteSetup(function() {
        if (Constants.IS_SANITY) {
            this.skip();
        }
    })
);

export { setupWipeDb, sanitySkipDetailed };
