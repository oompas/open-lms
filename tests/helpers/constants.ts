const getEnvVariable = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};

const Constants = {
    IS_SANITY: getEnvVariable('IS_SANITY'),
    envars: {
        NEXT_PUBLIC_SUPABASE_URL: getEnvVariable("NEXT_PUBLIC_SUPABASE_URL"),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        TEST_SUPABASE_URL: getEnvVariable("TEST_SUPABASE_URL"),
        TEST_SUPABASE_ANON_KEY: getEnvVariable("TEST_SUPABASE_ANON_KEY"),
        TEST_ADMIN_EMAIL: getEnvVariable("TEST_ADMIN_EMAIL"),
        TEST_ADMIN_PASSWORD: getEnvVariable("TEST_ADMIN_PASSWORD"),
        TEST_LEARNER_EMAIL: getEnvVariable("TEST_LEARNER_EMAIL"),
        TEST_LEARNER_PASSWORD: getEnvVariable("TEST_LEARNER_PASSWORD")
    },
    users: {
        LearnerName: "Testing learner account",
        LearnerEmail: getEnvVariable("TEST_LEARNER_EMAIL"),
        LearnerSignup: "2024-11-25T00:05:16.199291Z",

        AdminName: "Testing admin account",
        AdminEmail: getEnvVariable("TEST_ADMIN_EMAIL"),
        AdminSignup: "2024-11-25T00:07:57.484637Z"
    }
}

export default Constants;
