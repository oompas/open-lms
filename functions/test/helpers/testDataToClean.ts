import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const tmpDirPath = "./test/tmp";
const testUserFilePath = tmpDirPath + `/testUsers.json`;

/**
 * Add a test user (email + uid) to a temporary JSON file so it can be deleted up later
 */
const addTestUser = (email: string, uid: string) => {
    if (!existsSync(tmpDirPath)) {
        mkdirSync(tmpDirPath, { recursive: true });
    }

    const usersJson: { email: string, uid: string }[] = existsSync(testUserFilePath)
        ? JSON.parse(readFileSync(testUserFilePath, "utf-8"))
        : [];

    usersJson.push({email, uid});

    writeFileSync(testUserFilePath, JSON.stringify(usersJson, null, 4), "utf-8");
}

export { addTestUser, testUserFilePath, tmpDirPath };
