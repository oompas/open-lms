import { callAPI } from "../api.ts";

class TestCourseGenerator {
    public static async addDefaults() {
        await callAPI('create-course', {}, true);
    }
}

export default TestCourseGenerator;
