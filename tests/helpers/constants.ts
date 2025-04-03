const getEnvVariable = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};

const Constants = {
    envars: {
        "NEXT_PUBLIC_SUPABASE_URL": getEnvVariable("NEXT_PUBLIC_SUPABASE_URL"),
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": getEnvVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        "TEST_SUPABASE_URL": getEnvVariable("TEST_SUPABASE_URL"),
        "TEST_SUPABASE_ANON_KEY": getEnvVariable("TEST_SUPABASE_ANON_KEY"),
        "TEST_ADMIN_EMAIL": getEnvVariable("TEST_ADMIN_EMAIL"),
        "TEST_ADMIN_PASSWORD": getEnvVariable("TEST_ADMIN_PASSWORD"),
        "TEST_LEARNER_EMAIL": getEnvVariable("TEST_LEARNER_EMAIL"),
        "TEST_LEARNER_PASSWORD": getEnvVariable("TEST_LEARNER_PASSWORD")
    }
}

export default Constants;
