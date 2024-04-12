import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";

interface QuizQuestionDocument {
    id?: string;
    courseId: string;
    question: string;
    type: "tf" | "mc" | "sa";
    marks: number;
    answers: string[] | null;
    correctAnswer: number | null;
    order: number | null;
    stats: {
        numAttempts: number;
        totalScore: number;
        answers?: { [key: string]: number };
        distribution?: { [key: string]: number };
    } | null;
}

class QuizQuestion extends DatabaseObject {

    public static readonly collectionName = this.constructor.name;
    public static readonly collection = DatabaseObject.getCollection(this.collectionName);

    private readonly courseId: string;
    private readonly question: string;
    private readonly type: "tf" | "mc" | "sa";
    private readonly marks: number;
    private readonly answers: string[] | null;
    private readonly correctAnswer: number | null;
    private readonly order: number | null;
    private readonly stats: {
        numAttempts: number;
        totalScore: number;
        answers?: { [key: string]: number }; // Only for t/f & mc
        distribution?: { [key: string]: number }; // Only for sa
    };

    constructor(question: QuizQuestionDocument) {
        super(question.id);

        this.courseId = question.courseId;
        this.question = question.question;
        this.type = question.type;
        this.marks = question.marks;
        this.answers = question.answers;
        this.correctAnswer = question.correctAnswer;
        this.order = question.order;

        if (question.stats === null) {
            this.stats = {
                numAttempts: 0,
                totalScore: 0,
                ...(question.type === "tf" || question.type === "mc" ? { answers: {} } : { distribution: {} }),
                ...(question.type === "sa" ? { distribution: {} } : { answers: {} }),
            };
        } else {
            this.stats = question.stats;
        }
    }

    public getObject(noId?: boolean): QuizQuestionDocument {
        return {
            ...(!noId && { id: this.getId() }),
            courseId: this.courseId,
            question: this.question,
            type: this.type,
            marks: this.marks,
            answers: this.answers,
            correctAnswer: this.correctAnswer,
            order: this.order,
            stats: this.stats,
        };
    }

    public static fromFirestore(doc: firestore.QueryDocumentSnapshot | firestore.DocumentSnapshot): QuizQuestion {
        const question: QuizQuestionDocument = {
            id: doc.id,
            courseId: doc.get("courseId"),
            question: doc.get("question"),
            type: doc.get("type"),
            marks: doc.get("marks"),
            answers: doc.get("answers"),
            correctAnswer: doc.get("correctAnswer"),
            order: doc.get("order"),
            stats: doc.get("stats"),
        };
        return new QuizQuestion(question);
    }

    public static getDocumentById = (id: string): Promise<QuizQuestion> => super._getDocumentById(this.collection, id).then(doc => this.fromFirestore(doc));

    public static getAllDocs = () => super._getAllDocs(this.collection).then((docs) => docs.map((doc) => this.fromFirestore(doc)));

    public static delete = (docId: string) => super._delete(this.collection, docId);
}

export default QuizQuestion;
