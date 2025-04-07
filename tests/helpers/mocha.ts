import TestDatabaseHelper from "./database.ts";

const setupWipeDb = () => (
    setup(async function() {
        await TestDatabaseHelper.wipeDatabase();
    })
);

export { setupWipeDb };
