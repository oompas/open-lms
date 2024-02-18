import { existsSync, readFileSync, writeFileSync, mkdirSync, rm } from "fs";
import { randomString } from "./helpers";
import "./setupDummyData"; // Force setupDummyData to run first

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
const tmpFiles = {
    users: `${tmpDir}/users.json`,
    courses: `${tmpDir}/courses.json`,
};

const encoding = "utf-8";

/**
 * Dummy accounts for testing
 */
const dummyLearnerAccount = {
    email: "firebase_unit_tests_dummy_learner_account@gmail.com",
    password: randomString(20)
};
const dummyAdminAccount = {
    email: "firebase_unit_tests_dummy_admin_account@gmail.com",
    password: randomString(20)
};

/**
 * Add a test user (email + uid) to a temporary JSON file so it can be deleted up later
 */
const addTestUser = (email: string, password: string, uid: string) => {
    if (!existsSync(tmpDir)) {
        mkdirSync(tmpDir, { recursive: true });
    }

    const usersJson: { email: string, password: string, uid: string }[] = existsSync(tmpFiles.users)
        ? JSON.parse(readFileSync(tmpFiles.users, encoding))
        : [];

    usersJson.push({email, password, uid});

    writeFileSync(tmpFiles.users, JSON.stringify(usersJson, null, 4), encoding);
}

/**
 * Get all test users
 */
const getTestUsers = () => {
    return existsSync(tmpFiles.users)
        ? JSON.parse(readFileSync(tmpFiles.users, encoding))
        : [];
}

/**
 * Remove all temporary test data
 */
const cleanTempFiles = () => {
    if (!existsSync(tmpDir)) {
        return;
    }

    rm(tmpDir, { recursive: true }, (err) => {
        if (err) {
            throw new Error(`Error removing tmp directory: ${err}`);
        }
        console.log(`Successfully deleted temporary test files in directory ${tmpDir}`);
    });
}

export { dummyLearnerAccount, dummyAdminAccount, addTestUser, getTestUsers, cleanTempFiles };
