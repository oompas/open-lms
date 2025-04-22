const getEnvVariable = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};

// Parse an input string into a boolean ('true' or 'false', errors for other values)
const parseBool = (input: string) => {
    if (input === 'true') {
        return true;
    }
    if (input === 'false') {
        return false;
    }
    throw new Error(`Attempting to parse non-bool string to bool: ${input}`);
}

const Constants = {
    IS_SANITY: parseBool(getEnvVariable('IS_SANITY')),
    envars: {
        TEST_SUPABASE_URL: getEnvVariable("TEST_SUPABASE_URL"),
        TEST_SUPABASE_ANON_KEY: getEnvVariable("TEST_SUPABASE_ANON_KEY"),

        TEST_ADMIN_EMAIL: getEnvVariable("TEST_ADMIN_EMAIL"),
        TEST_ADMIN_PASSWORD: getEnvVariable("TEST_ADMIN_PASSWORD"),
        TEST_LEARNER_EMAIL: getEnvVariable("TEST_LEARNER_EMAIL"),
        TEST_LEARNER_PASSWORD: getEnvVariable("TEST_LEARNER_PASSWORD")
    },
    users: {
        LearnerName: "Test Learner",
        LearnerEmail: getEnvVariable("TEST_LEARNER_EMAIL"),
        LearnerSignup: "2025-04-14T15:27:01.952027Z",
        LearnerUUID: "d6552bc5-9cca-4a91-a0db-5433a0765275",

        AdminName: "Test Admin",
        AdminEmail: getEnvVariable("TEST_ADMIN_EMAIL"),
        AdminSignup: "2025-04-14T15:28:54.576427Z",
        AdminUUID: "8b1e773c-196b-40ea-b8d0-27f7bd5b7b6e"
    },
    courseStatus: {
        NOT_ENROLLED: "NOT_ENROLLED",
        ENROLLED: "ENROLLED",
        IN_PROGRESS: "IN_PROGRESS",
        AWAITING_MARKING: "AWAITING_MARKING",
        FAILED: "FAILED",
        COMPLETED: "COMPLETED"
    }
}

export default Constants;
