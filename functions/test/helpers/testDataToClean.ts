import { existsSync, readFileSync, writeFileSync } from "fs";

const testUserFilePath = "./test/testUsers.json";

const addTestUser = (email: string, uid: string) => {
    const usersJson: { email: string, uid: string }[] = existsSync(testUserFilePath)
        ? JSON.parse(readFileSync(testUserFilePath, "utf-8"))
        : [];

    usersJson.push({email, uid});

    writeFileSync(testUserFilePath, JSON.stringify(usersJson), "utf-8");
}

export { addTestUser, testUserFilePath };
