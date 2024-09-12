import DatabaseTable from './DatabaseTable.ts';

class Course extends DatabaseTable {
    constructor(data = {}) {
        super(data);
    }

    validateData(data) {
        const requiredFields = ['user_id', 'name'];
        const expectedTypes = {
            id: 'number',
            created_at: 'string',
            user_id: 'string',
            name: 'string',
            description: 'string',
            link: 'string',
            active: 'boolean',
            version: 'number',
            min_time: 'number',
            max_quiz_attempts: 'number',
            min_quiz_score: 'number',
            preserve_quiz_question_order: 'boolean',
            quiz_time_limit: 'number',
            total_quiz_marks: 'number',
            num_quiz_questions: 'number',
        };

        for (const field of requiredFields) {
            if (!data.hasOwnProperty(field)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        Object.keys(data).forEach((field) => {
            if (!expectedTypes.hasOwnProperty(field)) {
                throw new Error(`Invalid field: ${field}`);
            }

            const expectedType = expectedTypes[field];
            const actualType = typeof data[field];

            if (actualType !== expectedType) {
                throw new Error(`Invalid type for field ${field}: Expected ${expectedType}, got ${actualType}`);
            }
        });
    }

    initFields(data) {
        this.id = data.id;
        this.created_at = data.created_at;
        this.user_id = data.user_id;
        this.name = data.name;
        this.description = data.description;
        this.link = data.link;
        this.active = data.active;
        this.version = data.version;
        this.min_time = data.min_time;
        this.max_quiz_attempts = data.max_quiz_attempts;
        this.min_quiz_score = data.min_quiz_score;
        this.preserve_quiz_question_order = data.preserve_quiz_question_order;
        this.quiz_time_limit = data.quiz_time_limit;
        this.total_quiz_marks = data.total_quiz_marks;
        this.num_quiz_questions = data.num_quiz_questions;
    }
}

export default Course;
