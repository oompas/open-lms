import DatabaseTable, { ExpectedType } from './DatabaseTable.ts';

class Course extends DatabaseTable {

    private readonly id: number;
    private readonly created_at: string;
    private readonly user_id: string;
    private readonly name: string;
    private readonly description: string;
    private readonly link: string;
    private active: boolean;
    private readonly version: number;
    private readonly min_time: number | null;

    private readonly max_quiz_attempts: number | null;
    private readonly min_quiz_score: number | null;
    private readonly preserve_quiz_question_order: boolean | null;
    private readonly quiz_time_limit: number | null;
    private readonly total_quiz_marks: number | null;
    private readonly num_quiz_questions: number | null;

    protected expectedTypes: ExpectedTypes[] = [
        { name: 'id', type: 'number', nullable: false },
        { name: 'created_at', type: 'string', nullable: false },
        { name: 'user_id', type: 'string', nullable: false },
        { name: 'name', type: 'string', nullable: false },
        { name: 'description', type: 'string', nullable: false },
        { name: 'link', type: 'string', nullable: false },
        { name: 'active', type: 'boolean', nullable: false },
        { name: 'version', type: 'number', nullable: false },
        { name: 'min_time', type: 'number', nullable: true },

        { name: 'max_quiz_attempts', type: 'number', nullable: true },
        { name: 'min_quiz_score', type: 'number', nullable: true },
        { name: 'preserve_quiz_question_order', type: 'boolean', nullable: true },
        { name: 'quiz_time_limit', type: 'number', nullable: true },
        { name: 'total_quiz_marks', type: 'number', nullable: true },
        { name: 'num_quiz_questions', type: 'number', nullable: true },
    ];

    constructor(data: object) {
        super();

        super.validateData(data);

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
