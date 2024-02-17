import { existsSync, readFileSync, writeFileSync, mkdirSync, rm } from "fs";

/**
 * This file handles storing info about objects (users, courses, quizzes, etc) created during tests
 *
 * This can be used for other tests (e.g. to enroll in a course you need a real user & course ID)
 * or for cleanup afterward the tests (e.g. deleting all test users)
 */

/**
 * Paths to the temporary data files
 */
const tmpDir = "./test/tmp";
const paths = {
    users: `${tmpDir}/users.json`,
    courses: `${tmpDir}/courses.json`,
};

const encoding = "utf-8";

/**
 * Add a test user (email + uid) to a temporary JSON file so it can be deleted up later
 */
const addTestUser = (email: string, uid: string) => {
    if (!existsSync(tmpDir)) {
        mkdirSync(tmpDir, { recursive: true });
    }

    const usersJson: { email: string, uid: string }[] = existsSync(paths.users)
        ? JSON.parse(readFileSync(paths.users, encoding))
        : [];

    usersJson.push({email, uid});

    writeFileSync(paths.users, JSON.stringify(usersJson, null, 4), encoding);
}

/**
 * Get all test users
 */
const getTestUsers = () => {
    return existsSync(paths.users)
        ? JSON.parse(readFileSync(paths.users, encoding))
        : [];
}

/**
 * Remove all temporary test data
 */
const cleanTempFiles = () => {
    rm(tmpDir, { recursive: true }, (err) => {
        if (err) {
            throw new Error(`Error removing tmp directory: ${err}`);
        }
        console.log(`Successfully deleted temporary test files in directory ${tmpDir}`);
    });
}

export { addTestUser, getTestUsers, cleanTempFiles};
